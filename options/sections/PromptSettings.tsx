import { useState } from "react"
import { Plus, Trash2, Pencil, Check, X, RotateCcw, AlertTriangle } from "lucide-react"
import { DEFAULT_PROMPT_ID, DEFAULT_SYSTEM_PROMPT } from "~lib/types"
import { useAppSettings } from "~lib/storage"
import { Input } from "../../components/Input"

export const PromptSettings = () => {
    const [settings, setSettings] = useAppSettings()

    // UI State
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        content: ""
    })

    if (!settings) return null

    // --- Actions ---

    const handleEdit = (id: string) => {
        const prompt = settings.prompts.find(p => p.id === id)
        if (prompt) {
            setFormData({ name: prompt.name, content: prompt.content })
            setEditingId(id)
            setShowForm(true)
        }
    }

    const handleAdd = () => {
        setFormData({ name: "", content: DEFAULT_SYSTEM_PROMPT }) // 默认填充模板
        setEditingId(null)
        setShowForm(true)
    }

    const handleDelete = (id: string) => {
        // 检查是否有 API 正在使用此 Prompt
        const isUsed = settings.apiList.some(api => api.promptId === id)
        if (isUsed) {
            alert("无法删除：有一个或多个 API 服务正在使用此提示词。请先修改 API 配置。")
            return
        }

        if (confirm("确定要删除这个提示词配置吗？")) {
            setSettings(prev => ({
                ...prev,
                prompts: prev.prompts.filter(p => p.id !== id)
            }))
        }
    }

    const handleSave = () => {
        if (!formData.name.trim() || !formData.content.trim()) {
            return alert("请填写名称和内容")
        }

        setSettings(prev => {
            let newPrompts = [...prev.prompts]

            if (editingId) {
                // Update
                newPrompts = newPrompts.map(p =>
                    p.id === editingId
                        ? { ...p, name: formData.name, content: formData.content }
                        : p
                )
            } else {
                // Create
                newPrompts.push({
                    id: crypto.randomUUID(),
                    name: formData.name,
                    content: formData.content,
                    isDefault: false
                })
            }

            return { ...prev, prompts: newPrompts }
        })

        setShowForm(false)
    }

    const handleResetDefault = (id: string) => {
        if (confirm("确定要重置为初始默认内容吗？")) {
            setSettings(prev => ({
                ...prev,
                prompts: prev.prompts.map(p =>
                    p.id === id
                        ? { ...p, content: DEFAULT_SYSTEM_PROMPT }
                        : p
                )
            }))
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium">系统提示词 (Prompts)</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        自定义 AI 的翻译风格、语气或特定领域的术语处理方式。
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
                    >
                        <Plus size={16} /> 新建提示词
                    </button>
                )}
            </div>

            {/* List View */}
            {!showForm && (
                <div className="grid grid-cols-1 gap-4">
                    {settings.prompts.map(prompt => (
                        <div key={prompt.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-800">{prompt.name}</h3>
                                    {prompt.isDefault && (
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                            系统默认
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(prompt.id)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        title="编辑"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    {!prompt.isDefault && (
                                        <button
                                            onClick={() => handleDelete(prompt.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="删除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded border font-mono whitespace-pre-wrap line-clamp-3 max-h-24 overflow-hidden">
                                    {prompt.content}
                                </pre>
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                            </div>
                            <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-2">
                                <span>ID: {prompt.id.slice(0, 8)}...</span>
                                {settings.apiList.filter(api => api.promptId === prompt.id).length > 0 && (
                                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 rounded">
                                        <Check size={10} /> 正在被使用
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Form */}
            {showForm && (
                <div className="border border-blue-100 rounded-xl p-6 bg-white shadow-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-gray-800">
                            {editingId ? '编辑提示词' : '新建提示词'}
                        </h3>
                        {editingId === DEFAULT_PROMPT_ID && (
                            <button
                                onClick={() => handleResetDefault(editingId)}
                                className="text-xs flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100"
                            >
                                <RotateCcw size={12} /> 重置默认内容
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="配置名称"
                            placeholder="例如: 学术论文翻译 / 代码解释模式"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex justify-between">
                                <span>提示词内容 (System Prompt)</span>
                                <span className="text-xs text-gray-400 font-normal">支持变量: {"{{to}}"} (目标语言)</span>
                            </label>
                            <textarea
                                className="w-full h-64 p-4 rounded-md border border-gray-300 font-mono text-sm bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="You are a helper..."
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <div>
                                提示：请保留 <code>{"{{to}}"}</code> 占位符，翻译时它会被自动替换为目标语言（如 "Chinese", "English"）。
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition"
                        >
                            保存
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}