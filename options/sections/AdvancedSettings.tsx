import { useAppSettings } from "~lib/storage"
import { DEFAULT_SETTINGS } from "~lib/types"
import { Save, Trash, Download, Upload, RotateCcw, Bug, History, Clock, ArrowRight } from "lucide-react"

export const AdvancedSettings = () => {
    const [settings, setSettings] = useAppSettings()
    if (!settings) return null

    // 1. 恢复默认设置
    const handleReset = () => {
        if (confirm("警告：确定要恢复所有设置为默认值吗？\n这将清除您所有的 API Key 和自定义 Prompt。")) {
            setSettings(DEFAULT_SETTINGS)
        }
    }

    // 2. 导出配置
    const handleExport = () => {
        // 移除 history 再导出，通常用户只想导出配置，不想导出聊天记录
        const { history, ...configOnly } = settings
        const dataStr = JSON.stringify(configOnly, null, 2)
        const blob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `llm-translator-config-${new Date().toISOString().slice(0, 10)}.json`
        link.href = url
        link.click()
    }

    // 3. 导入配置
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)
                if ('apiList' in json && 'prompts' in json) {
                    if (confirm("确定要导入配置吗？这将覆盖当前设置。")) {
                        // 导入时保留当前的历史记录，只覆盖配置
                        setSettings(prev => ({
                            ...DEFAULT_SETTINGS,
                            ...json,
                            history: prev.history
                        }))
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

    // 4. 清除缓存/历史
    const clearCache = () => {
        const count = settings.history.length
        if (count === 0) {
            return alert("当前没有历史记录/缓存。")
        }

        if (confirm(`确定清除所有翻译历史缓存吗？\n当前共有 ${count} 条记录。`)) {
            setSettings(prev => ({
                ...prev,
                history: [] // 清空数组
            }))
            // 如果有其他 localStorage 缓存 (比如 API 响应缓存)，也应在这里 localStorage.removeItem('xxx')
            alert("缓存已清理。")
        }
    }

    // 删除单条记录
    const handleDeleteItem = (id: string) => {
        setSettings(prev => ({
            ...prev,
            history: prev.history.filter(item => item.id !== id)
        }))
    }

    // 格式化时间戳
    const formatTime = (ts: number) => new Date(ts).toLocaleString()

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 历史与缓存设置 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">历史记录与缓存</h3>
                <div className="bg-card border rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-foreground">翻译历史记录上限</label>
                            <p className="text-xs text-muted-foreground">保留最近多少条翻译记录，超出后自动删除旧记录。</p>
                        </div>
                        <input
                            type="number" min="0" max="1000"
                            value={settings.historyLimit}
                            onChange={(e) => setSettings({ ...settings, historyLimit: parseInt(e.target.value) })}
                            className="w-24 h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary text-center"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                            <label className="text-sm font-medium text-foreground">启用缓存 (重复请求)</label>
                            <p className="text-xs text-muted-foreground">对完全相同的输入直接返回本地历史结果，减少 API Token 消耗。</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.cacheEnabled}
                            onChange={(e) => setSettings({ ...settings, cacheEnabled: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                        />
                    </div>

                    {/* [新增] 历史记录列表预览 */}
                    <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-medium mb-3 text-foreground">最近记录</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {settings.history.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">暂无历史记录</p>
                            ) : (
                                settings.history.map(item => (
                                    <div key={item.id} className="text-xs border border-border rounded p-3 bg-muted/20 hover:bg-muted/40 transition group relative">
                                        <div className="flex justify-between items-start mb-1 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <span className="uppercase bg-muted px-1 rounded text-[10px]">{item.sourceLang}</span>
                                                <ArrowRight size={10} />
                                                <span className="uppercase bg-muted px-1 rounded text-[10px]">{item.targetLang}</span>
                                            </div>
                                            <span className="text-[10px] flex items-center gap-1">
                                                <Clock size={10} /> {formatTime(item.timestamp)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
                                            <div className="text-foreground line-clamp-2" title={item.sourceText}>{item.sourceText}</div>
                                            <div className="text-muted-foreground pt-0.5">→</div>
                                            <div className="text-foreground line-clamp-2" title={item.targetText}>{item.targetText}</div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                                            title="删除此条"
                                        >
                                            <Trash size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </section>

            {/* 调试模式 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">调试模式</h3>
                <div className="bg-card border rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full text-muted-foreground"><Bug size={20} /></div>
                        <div>
                            <label className="text-sm font-medium text-foreground">启用详细日志</label>
                            <p className="text-xs text-muted-foreground">在 Background Service Worker 控制台输出详细的 API 请求与响应日志。</p>
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

            {/* 数据管理操作区 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">数据管理</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition">
                        <Download size={16} /> 导出配置 (不含历史)
                    </button>
                    <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition cursor-pointer">
                        <Upload size={16} /> 导入配置
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                    <button onClick={clearCache} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition">
                        <Trash size={16} /> 清除所有缓存/历史
                    </button>
                    <button onClick={handleReset} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 text-sm font-medium transition">
                        <RotateCcw size={16} /> 恢复默认设置
                    </button>
                </div>
            </section>
        </div>
    )
}