import { useAppSettings } from "~lib/storage"
import { BookIcon, LayoutPanelLeft, Ban } from "lucide-react"

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
            <section>
                <h3 className="text-lg font-medium mb-4 text-gray-800">划词交互模式</h3>
                <div className="grid grid-cols-1 gap-4">
                    {MODES.map((mode) => (
                        <div
                            key={mode.id}
                            onClick={() => setSettings({ ...settings, selectionMode: mode.id as any })}
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${settings.selectionMode === mode.id
                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-white bg-gray-50/50'
                                }`}
                        >
                            <div className={`p-3 rounded-full ${settings.selectionMode === mode.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                <mode.icon size={20} />
                            </div>
                            <div>
                                <h4 className={`font-medium ${settings.selectionMode === mode.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {mode.label}
                                </h4>
                                <p className="text-sm text-gray-500 mt-0.5">{mode.desc}</p>
                            </div>
                            <div className="ml-auto">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${settings.selectionMode === mode.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                    {settings.selectionMode === mode.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {settings.selectionMode === 'icon' && (
                <section className="animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-lg font-medium mb-4 text-gray-800">图标位置微调</h3>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-600">图标偏移量 (px):</label>
                        <input
                            type="range" min="0" max="50"
                            value={settings.iconOffset}
                            onChange={(e) => setSettings({ ...settings, iconOffset: parseInt(e.target.value) })}
                            className="w-48"
                        />
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{settings.iconOffset}px</span>
                    </div>
                </section>
            )}
        </div>
    )
}