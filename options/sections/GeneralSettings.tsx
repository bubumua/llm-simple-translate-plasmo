import { useAppSettings } from "~lib/storage"
import { Monitor, Moon, Sun, Repeat } from "lucide-react"
import { Input } from "../../components/Input"
import { LANGUAGES } from "~lib/types"

export const GeneralSettings = () => {
    const [settings, setSettings] = useAppSettings()

    if (!settings) return null

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. 语言设置 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-gray-800">翻译语言</h3>
                <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">首选语言 (Native)</label>
                        <select
                            value={settings.targetLang1}
                            onChange={(e) => setSettings({ ...settings, targetLang1: e.target.value })}
                            className="w-full h-10 rounded-md border-gray-300 border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-center pb-2 text-gray-400">
                        <Repeat size={20} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">第二语言 (Foreign)</label>
                        <select
                            value={settings.targetLang2}
                            onChange={(e) => setSettings({ ...settings, targetLang2: e.target.value })}
                            className="w-full h-10 rounded-md border-gray-300 border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="autoSwap"
                        checked={settings.autoSwapLang}
                        onChange={(e) => setSettings({ ...settings, autoSwapLang: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="autoSwap" className="text-sm text-gray-600 select-none cursor-pointer">
                        智能互译：如果检测到原文是首选语言，自动翻译为第二语言。
                    </label>
                </div>
            </section>

            <hr className="border-gray-100" />

            {/* 2. 主题设置 */}
            <section>
                <h3 className="text-lg font-medium mb-4 text-gray-800">界面外观</h3>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { val: 'light', label: '浅色', icon: Sun },
                        { val: 'dark', label: '深色', icon: Moon },
                        { val: 'system', label: '跟随系统', icon: Monitor },
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => setSettings({ ...settings, theme: opt.val as any })}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${settings.theme === opt.val
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <opt.icon size={24} />
                            <span className="text-sm font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            <hr className="border-gray-100" />

            {/* 3. API 策略 */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-800">API 策略</h3>
                </div>
                <div className="bg-white border rounded-lg p-4 flex items-start gap-3">
                    <div className="pt-0.5">
                        <input
                            type="checkbox"
                            id="autoSwitch"
                            checked={settings.autoSwitchApi}
                            onChange={(e) => setSettings({ ...settings, autoSwitchApi: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                        />
                    </div>
                    <div>
                        <label htmlFor="autoSwitch" className="font-medium text-sm text-gray-900 block mb-1 cursor-pointer">
                            开启故障转移 (Failover)
                        </label>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            当首选 API 请求失败或超时，自动尝试列表中的下一个可用 API。建议您配置至少两个服务提供商。
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}