import { useAppSettings } from "~lib/storage"
import { BookIcon, LayoutPanelLeft, Ban, Clock, Move } from "lucide-react"

export const SelectionSettings = () => {
    const [settings, setSettings] = useAppSettings()

    if (!settings) return null

    const MODES = [
        { id: 'icon', label: '显示图标', desc: '选中后显示浮动图标，点击翻译', icon: BookIcon },
        { id: 'panel', label: '直接翻译', desc: '选中后立即显示翻译面板', icon: LayoutPanelLeft },
        { id: 'off', label: '关闭划词', desc: '仅使用右键菜单或快捷键', icon: Ban },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 模式选择 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-foreground">划词交互模式</h3>
                <div className="grid grid-cols-1 gap-4">
                    {MODES.map((mode) => (
                        <div
                            key={mode.id}
                            onClick={() => setSettings({ ...settings, selectionMode: mode.id as any })}
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${settings.selectionMode === mode.id
                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50 hover:bg-card bg-muted/30'
                                }`}
                        >
                            <div className={`p-3 rounded-full ${settings.selectionMode === mode.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
                                <mode.icon size={20} />
                            </div>
                            <div>
                                <h4 className={`font-medium ${settings.selectionMode === mode.id ? 'text-primary' : 'text-foreground'}`}>
                                    {mode.label}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-0.5">{mode.desc}</p>
                            </div>
                            <div className="ml-auto">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${settings.selectionMode === mode.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                                    }`}>
                                    {settings.selectionMode === mode.id && <div className="w-2 h-2 bg-background rounded-full" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 通用设置：响应延时 */}
            {settings.selectionMode !== 'off' && (
                <section className="animate-in fade-in slide-in-from-top-2 border-t border-border pt-6">
                    <h3 className="text-lg font-medium mb-4 text-foreground">响应设置</h3>
                    <div className="space-y-4 max-w-sm">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Clock size={16} className="text-muted-foreground" />
                                划词响应延时 (ms)
                            </label>
                            {/* [调整] 改为输入框 */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="number" min="0" max="2000" step="50"
                                    value={settings.selectionDelay}
                                    onChange={(e) => setSettings({ ...settings, selectionDelay: parseInt(e.target.value) })}
                                    className="flex-1 h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary"
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">毫秒</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                鼠标抬起后等待多久才显示图标/面板。建议设置 100-300ms 以防止误触。
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* 图标详细设置 */}
            {settings.selectionMode === 'icon' && (
                <section className="animate-in fade-in slide-in-from-top-2 border-t border-border pt-6">
                    <h3 className="text-lg font-medium mb-4 text-foreground">翻译图标样式</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 位置偏移 */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Move size={16} /> 相对鼠标偏移 (px)
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">水平 (X)</label>
                                    <input
                                        type="number" value={settings.iconOffsetX}
                                        onChange={e => setSettings({ ...settings, iconOffsetX: parseInt(e.target.value) })}
                                        className="w-full h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary"
                                        placeholder="正数向右，负数向左"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">垂直 (Y)</label>
                                    <input
                                        type="number" value={settings.iconOffsetY}
                                        onChange={e => setSettings({ ...settings, iconOffsetY: parseInt(e.target.value) })}
                                        className="w-full h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary"
                                        placeholder="正数向下，负数向上"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                提示：设置 Y 为负数可以让图标显示在鼠标上方。
                            </p>
                        </div>

                        {/* 尺寸 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">图标大小 ({settings.iconSize}px)</label>
                            <div className="flex gap-2">
                                {[32, 48, 96, 128].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setSettings({ ...settings, iconSize: size as any })}
                                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${settings.iconSize === size
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-foreground border-input hover:bg-muted'
                                            }`}
                                    >
                                        {size}px
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 面板详细设置 */}
            {settings.selectionMode !== 'off' && (
                <section className="animate-in fade-in slide-in-from-top-2 border-t border-border pt-6">
                    <h3 className="text-lg font-medium mb-4 text-foreground">翻译面板样式</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">默认宽度 (px)</label>
                            <input
                                type="number" value={settings.panelWidth}
                                onChange={e => setSettings({ ...settings, panelWidth: parseInt(e.target.value) })}
                                className="w-full h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">字体大小 (px)</label>
                            <input
                                type="number" value={settings.panelFontSize}
                                onChange={e => setSettings({ ...settings, panelFontSize: parseInt(e.target.value) })}
                                className="w-full h-9 rounded border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs text-muted-foreground">初始位置</label>
                            <div className="flex gap-4 mt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={settings.panelInitialPos === 'top'} onChange={() => setSettings({ ...settings, panelInitialPos: 'top' })} className="accent-primary" />
                                    <span className="text-sm text-foreground">选中文本上方</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={settings.panelInitialPos === 'bottom'} onChange={() => setSettings({ ...settings, panelInitialPos: 'bottom' })} className="accent-primary" />
                                    <span className="text-sm text-foreground">选中文本下方</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}