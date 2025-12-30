import { useAppSettings } from "~lib/storage"
import { DEFAULT_SETTINGS } from "~lib/types"
import { Save, Trash, Download, Upload, RotateCcw, Bug } from "lucide-react"

export const AdvancedSettings = () => {
    const [settings, setSettings] = useAppSettings()
    if (!settings) return null

    const handleReset = () => {
        if (confirm("警告：确定要恢复所有设置为默认值吗？这将清除您所有的 API Key 和自定义 Prompt。")) {
            setSettings(DEFAULT_SETTINGS)
        }
    }

    const handleExport = () => {
        const dataStr = JSON.stringify(settings, null, 2)
        const blob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `llm-translator-config-${new Date().toISOString().slice(0, 10)}.json`
        link.href = url
        link.click()
    }

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)
                // 简单的校验：检查是否包含关键字段
                if ('apiList' in json && 'prompts' in json) {
                    if (confirm("确定要导入配置吗？这将覆盖当前设置。")) {
                        setSettings({ ...DEFAULT_SETTINGS, ...json })
                        alert("导入成功！")
                    }
                } else {
                    alert("无效的配置文件格式。")
                }
            } catch (err) {
                alert("文件解析失败。")
            }
        }
        reader.readAsText(file)
    }

    const clearCache = () => {
        // 这里只是模拟，实际需要在 background 或 storage 中实现清理逻辑
        // 如果你用的是 plasmo storage 且 key 不多，可能不需要专门清理，
        // 但如果有 history 列表存储，这里应该清空它。
        if (confirm("确定清除所有翻译历史缓存吗？")) {
            // 假设我们在 storage 里有个 history key (目前 types 里还没定义 history 数组，暂留空)
            alert("缓存已清理 (功能预留)")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 历史与缓存 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">历史记录与缓存</h3>
                <div className="bg-card border rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-foreground">翻译历史记录上限</label>
                            <p className="text-xs text-muted-foreground">保留最近多少条翻译记录</p>
                        </div>
                        <input
                            type="number" min="0" max="100"
                            value={settings.historyLimit}
                            onChange={(e) => setSettings({ ...settings, historyLimit: parseInt(e.target.value) })}
                            className="w-20 h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary text-center"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                            <label className="text-sm font-medium text-foreground">启用缓存 (重复请求)</label>
                            <p className="text-xs text-muted-foreground">对相同的输入直接返回本地结果，减少 API 消耗</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.cacheEnabled}
                            onChange={(e) => setSettings({ ...settings, cacheEnabled: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                        />
                    </div>
                </div>
            </section>

            {/* 调试 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">调试模式</h3>
                <div className="bg-card border rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full text-muted-foreground"><Bug size={20} /></div>
                        <div>
                            <label className="text-sm font-medium text-foreground">启用详细日志</label>
                            <p className="text-xs text-muted-foreground">在控制台输出 API 请求与响应详情</p>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.debugMode}
                        onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                        className="w-5 h-5 accent-primary"
                    />
                </div>
            </section>

            {/* 数据管理 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">数据管理</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition">
                        <Download size={16} /> 导出配置
                    </button>
                    <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition cursor-pointer">
                        <Upload size={16} /> 导入配置
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                    <button onClick={clearCache} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition">
                        <Trash size={16} /> 清除缓存
                    </button>
                    <button onClick={handleReset} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition">
                        <RotateCcw size={16} /> 恢复默认设置
                    </button>
                </div>
            </section>
        </div>
    )
}