import { useAppSettings } from "~lib/storage"
import { BookIcon, LayoutPanelLeft, Ban, ArrowUpLeft, ArrowUp, ArrowUpRight, ArrowLeft, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight } from "lucide-react"

export const SelectionSettings = () => {
    const [settings, setSettings] = useAppSettings()

    if (!settings) return null

    const MODES = [
        { id: 'icon', label: '显示图标', desc: '选中后显示浮动图标，点击翻译', icon: BookIcon },
        { id: 'panel', label: '直接翻译', desc: '选中后立即显示翻译面板', icon: LayoutPanelLeft },
        { id: 'off', label: '关闭划词', desc: '仅使用右键菜单或快捷键', icon: Ban },
    ]

    const PositionGrid = () => {
        const positions = [
            { id: 'top-left', icon: ArrowUpLeft }, { id: 'top', icon: ArrowUp }, { id: 'top-right', icon: ArrowUpRight },
            { id: 'left', icon: ArrowLeft }, { id: 'center', icon: null }, { id: 'right', icon: ArrowRight },
            { id: 'bottom-left', icon: ArrowDownLeft }, { id: 'bottom', icon: ArrowDown }, { id: 'bottom-right', icon: ArrowDownRight },
        ]

        return (
            <div className="grid grid-cols-3 gap-2 w-32">
                {positions.map((pos) => {
                    if (pos.id === 'center') return <div key="center" className="w-8 h-8" /> // 占位
                    const Icon = pos.icon
                    const isSelected = settings.iconPosition === pos.id
                    return (
                        <button
                            key={pos.id}
                            onClick={() => setSettings({ ...settings, iconPosition: pos.id as any })}
                            className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-muted-foreground border-input hover:bg-muted'
                                }`}
                            title={pos.id}
                        >
                            <Icon size={16} />
                        </button>
                    )
                })}
            </div>
        )
    }

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

            {/* 图标详细设置 */}
            {settings.selectionMode === 'icon' && (
                <section className="animate-in fade-in slide-in-from-top-2 border-t border-border pt-6">
                    <h3 className="text-lg font-medium mb-4 text-foreground">翻译按钮样式</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 位置选择 */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">显示位置 (相对于鼠标)</label>
                            <PositionGrid />
                        </div>

                        {/* 尺寸和偏移 */}
                        <div className="space-y-6">
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">偏移距离 ({settings.iconOffset}px)</label>
                                <input
                                    type="range" min="0" max="50"
                                    value={settings.iconOffset}
                                    onChange={(e) => setSettings({ ...settings, iconOffset: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 面板详细设置 (无论icon还是panel模式都需要) */}
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
                            <label className="text-xs text-muted-foreground">默认高度 (px)</label>
                            <input
                                type="number" value={settings.panelHeight}
                                onChange={e => setSettings({ ...settings, panelHeight: parseInt(e.target.value) })}
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