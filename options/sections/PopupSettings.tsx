import { useAppSettings } from "~lib/storage"
import { Zap, MousePointerClick } from "lucide-react"

export const PopupSettings = () => {
    const [settings, setSettings] = useAppSettings()
    if (!settings) return null

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-medium text-foreground">弹窗 (Popup) 翻译设置</h2>
                <p className="text-xs text-muted-foreground mt-1">配置点击浏览器扩展图标时的行为。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 自动翻译卡片 */}
                <div
                    onClick={() => setSettings({ ...settings, popupAutoTranslate: true })}
                    className={`p-5 rounded-xl border cursor-pointer transition-all ${settings.popupAutoTranslate
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Zap size={20} className={settings.popupAutoTranslate ? "text-primary" : "text-muted-foreground"} />
                        <h3 className={`font-medium ${settings.popupAutoTranslate ? "text-primary" : "text-foreground"}`}>自动翻译</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">输入文字停止后，自动开始翻译。</p>

                    {settings.popupAutoTranslate && (
                        <div className="mt-4 pt-4 border-t border-primary/20 animate-in fade-in">
                            <label className="text-xs font-medium text-foreground block mb-1.5">防抖延迟 (ms)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range" min="300" max="2000" step="100"
                                    value={settings.popupDebounceTime}
                                    onChange={(e) => setSettings({ ...settings, popupDebounceTime: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-primary/20 text-primary">
                                    {settings.popupDebounceTime}ms
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                                为了节省 API Token，建议设置大于 500ms 的延迟。
                            </p>
                        </div>
                    )}
                </div>

                {/* 手动翻译卡片 */}
                <div
                    onClick={() => setSettings({ ...settings, popupAutoTranslate: false })}
                    className={`p-5 rounded-xl border cursor-pointer transition-all ${!settings.popupAutoTranslate
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <MousePointerClick size={20} className={!settings.popupAutoTranslate ? "text-primary" : "text-muted-foreground"} />
                        <h3 className={`font-medium ${!settings.popupAutoTranslate ? "text-primary" : "text-foreground"}`}>手动翻译</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">显示“翻译”按钮，点击后才开始请求。</p>
                </div>
            </div>
        </div>
    )
}