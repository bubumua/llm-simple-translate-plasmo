import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getAppSettings, storage } from "~lib/storage" // [修正] 引用封装好的 storage helper
import type { ApiConfig, TranslateRequestBody, TranslateResponseBody, TranslationHistoryItem } from "~lib/types"

// --- Helper: SSE 解析 (OpenAI 格式) ---
const parseSSE = (line: string): string | null => {
    if (!line.startsWith("data: ")) return null
    const data = line.slice(6)
    if (data === "[DONE]") return null
    try {
        const json = JSON.parse(data)
        return json.choices?.[0]?.delta?.content || null
    } catch {
        return null
    }
}

// --- Helper: System Prompt 变量替换 ---
const buildSystemPrompt = (template: string, targetLang: string): string => {
    return template
        .replace(/{target_lang}|{{to}}/g, targetLang) // 支持 {target_lang} 或 {{to}} 写法
        .replace(/{source_lang}/g, "Auto") // 暂时写死，后续可传入
}

const handler: PlasmoMessaging.PortHandler<TranslateRequestBody, TranslateResponseBody> = async (req, res) => {
    const { text, sourceLang, targetLang, signal } = req.body
    if (!text) return

    try {
        // 1. 获取配置
        const settings = await getAppSettings()
        if (settings.debugMode) console.log(settings);

        // --- [新增] 缓存检查逻辑 ---
        if (settings.cacheEnabled) {
            // 简单的匹配逻辑：原文、源语言、目标语言一致
            const cachedItem = settings.history.find(item =>
                item.sourceText.trim() === text.trim() &&
                item.targetLang === targetLang &&
                item.sourceLang === sourceLang
            )

            if (cachedItem) {
                if (settings.debugMode) console.log(`[Translate] Cache Hit! Returning local result.`)
                // 模拟流式发送（其实是一次性发完），这样前端不用改代码
                res.send({
                    status: "streaming",
                    chunk: cachedItem.targetText,
                    apiName: "Local Cache"
                })
                res.send({ status: "completed" })
                return // 结束处理
            }
        }

        // 2. 确定 API 调用顺序 (Failover 逻辑)
        let apisToTry: ApiConfig[] = []

        if (settings.autoSwitchApi) {
            // 自动切换：尝试所有启用的 API
            apisToTry = settings.apiList.filter(api => api.isEnabled)
        } else {
            // 不自动切换：只尝试列表中的第一个启用项
            const firstActive = settings.apiList.find(api => api.isEnabled)
            if (firstActive) apisToTry = [firstActive]
        }

        if (apisToTry.length === 0) {
            res.send({ status: "error", errorMsg: "没有可用的 API 配置，请前往设置页添加并启用 API。" })
            return
        }

        // 3. 循环尝试 API
        let lastError = ""
        let fullTranslation = "" // 用于记录完整结果以便保存
        let activeApiId = ""     // 记录是哪个 API 成功的
        let success = false

        for (const api of apisToTry) {
            try {
                console.log(`[Translate] Trying API: ${api.name}`)
                const promptConfig = settings.prompts.find(p => p.id === api.promptId) || settings.prompts[0]
                const systemPrompt = buildSystemPrompt(promptConfig.content, targetLang)

                const response = await fetch(
                    `${api.baseUrl.replace(/\/+$/, "")}/chat/completions`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${api.apiKey}`
                        },
                        body: JSON.stringify({
                            model: api.model,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: text }
                            ],
                            stream: true,
                            temperature: 0.3
                        }),
                    })

                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                if (!response.body) throw new Error("Empty body")

                const reader = response.body.getReader()
                const decoder = new TextDecoder("utf-8")
                let buffer = ""
                let hasSentApiName = false

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })
                    buffer += chunk
                    const lines = buffer.split("\n")
                    buffer = lines.pop() || ""

                    for (const line of lines) {
                        const content = parseSSE(line.trim())
                        if (content) {
                            fullTranslation += content // 累加结果
                            res.send({
                                status: "streaming",
                                chunk: content,
                                apiName: !hasSentApiName ? api.name : undefined
                            })
                            hasSentApiName = true
                        }
                    }
                }

                success = true
                activeApiId = api.id
                break // 成功，跳出循环

            } catch (e: any) {
                console.warn(`[Translate] API ${api.name} failed:`, e)
                lastError = e.message
                fullTranslation = "" // 清空失败的部分结果
            }
        }

        if (!success) {
            res.send({ status: "error", errorMsg: `所有 API 失败: ${lastError}` })
            return
        }

        // 4. 发送完成信号
        res.send({ status: "completed" })

        // 保存历史记录
        if (fullTranslation.trim()) {
            await saveHistory(text, fullTranslation, sourceLang, targetLang, activeApiId)
        }

    } catch (err: any) {
        // 捕获 getAppSettings 或其他未知错误
        res.send({ status: "error", errorMsg: `Background Service Error: ${err.message}` })
    }
}

// 独立的保存函数，避免主逻辑过乱
async function saveHistory(source: string, target: string, sLang: string, tLang: string, apiId: string) {
    try {
        // 重新获取最新配置，避免并发覆盖
        const currentSettings = await getAppSettings()

        const newItem: TranslationHistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            sourceText: source.trim(),
            targetText: target.trim(),
            sourceLang: sLang,
            targetLang: tLang,
            apiId: apiId
        }

        // 插入头部
        let newHistory = [newItem, ...currentSettings.history]

        // 限制长度
        if (newHistory.length > currentSettings.historyLimit) {
            newHistory = newHistory.slice(0, currentSettings.historyLimit)
        }

        // 写入 Storage
        // 注意：这里需要只更新 history 字段，但 Storage 类 set 方法通常是覆盖或单 key 更新。
        // 我们的 key 是 "app-settings"，是一整个对象。
        await storage.set("app-settings", {
            ...currentSettings,
            history: newHistory
        })
        console.log(`[History] Saved. Total: ${newHistory.length}`)
    } catch (e) {
        console.error("[History] Save failed", e)
    }
}

export default handler