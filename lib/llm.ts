import type { ApiConfig } from "./types"

// 定义流式回调的类型
type StreamCallbacks = {
    onMessage: (content: string) => void
    onError: (error: string) => void
    onFinish: () => void
}

/**
 * 核心 LLM 调用函数
 * 支持 OpenAI 兼容格式 (Claude/Gemini 若使用兼容层也适用)
 */
export async function streamLLM(
    api: ApiConfig,
    messages: { role: string; content: string }[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal // 用于取消请求
) {
    try {
        const response = await fetch(`${api.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${api.apiKey}`
            },
            body: JSON.stringify({
                model: api.model,
                messages: messages,
                stream: true, // 开启流式
                temperature: 0.3
            }),
            signal
        })

        if (!response.ok) {
            const errText = await response.text()
            throw new Error(`API Error ${response.status}: ${errText}`)
        }

        if (!response.body) throw new Error("No response body")

        // --- SSE 解析逻辑 ---
        const reader = response.body.getReader()
        const decoder = new TextDecoder("utf-8")
        let buffer = ""

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // 解码并存入缓冲
            buffer += decoder.decode(value, { stream: true })

            // 按行处理 SSE 数据
            const lines = buffer.split("\n")
            // 保留最后一个可能不完整的行
            buffer = lines.pop() || ""

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || !trimmed.startsWith("data: ")) continue

                const data = trimmed.slice(6) // 去掉 "data: "

                if (data === "[DONE]") {
                    callbacks.onFinish()
                    return
                }

                try {
                    const json = JSON.parse(data)
                    // 提取 content。兼容不同厂商的细微差异
                    const delta = json.choices?.[0]?.delta?.content || ""
                    if (delta) {
                        callbacks.onMessage(delta)
                    }
                } catch (e) {
                    console.warn("JSON Parse error:", e, data)
                }
            }
        }

        // 循环结束
        callbacks.onFinish()

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Request aborted by user')
            return
        }
        callbacks.onError(error.message || "Unknown error")
    }
}