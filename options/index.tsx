import { useState } from "react"
import { Settings, Server, MessageSquare, MousePointer2, Info } from "lucide-react"
import { GeneralSettings } from "./sections/GeneralSettings"
import { ApiSettings } from "./sections/ApiSettings"
import { PromptSettings } from "./sections/PromptSettings"
import { SelectionSettings } from "./sections/SelectionSettings"
import "~style.css"

function OptionsIndex() {
    const [activeTab, setActiveTab] = useState("general")

    const renderContent = () => {
        switch (activeTab) {
            case "general": return <GeneralSettings />
            case "api": return <ApiSettings />
            case "prompts": return <PromptSettings />
            case "selection": return <SelectionSettings />
            case "about": return (
                <div className="p-8 text-center text-gray-500">
                    <h2 className="text-xl font-bold mb-2 text-gray-800">LLM Translator</h2>
                    <p>Designed for power users who want to bring their own models.</p>
                    <div className="mt-8 border p-4 rounded bg-gray-50 text-left text-xs font-mono">
                        MIT License <br />
                        Built with Plasmo, React, Tailwind & OpenAI API.
                    </div>
                </div>
            )
            default: return <GeneralSettings />
        }
    }

    const menuItems = [
        { id: "general", label: "常规设置", icon: Settings },
        { id: "api", label: "API 服务", icon: Server },
        { id: "prompts", label: "AI 提示词", icon: MessageSquare },
        { id: "selection", label: "划词交互", icon: MousePointer2 },
        { id: "about", label: "关于插件", icon: Info },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex text-gray-800">
            {/* 侧边栏 */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        LLM Translator
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">v0.0.1 Dev</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 ml-64 p-8 max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px] animate-in fade-in duration-200">
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}

export default OptionsIndex