import { useState } from "react"
import {
    Trash2, Plus, GripVertical, Pencil, CheckCircle2,
    AlertCircle, Loader2, Play, Power, PowerOff
} from "lucide-react"
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay
} from "@dnd-kit/core"
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useAppSettings } from "~lib/storage"
import { Input } from "../../components/Input"
import type { ApiConfig } from "~lib/types"
import { DEFAULT_PROMPT_ID } from "~lib/types"

// --- Helper: 独立的测试连接函数 (返回结果而不是 void) ---
async function testConnection(config: Partial<ApiConfig>): Promise<{ success: boolean, msg: string }> {
    if (!config.apiKey) return { success: false, msg: "缺少 API Key" }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        // 简单的 OpenAI 格式连通性测试
        const res = await fetch(`${config.baseUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (res.ok) {
            return { success: true, msg: "连接成功" }
        } else {
            const err = await res.text().catch(() => "")
            return { success: false, msg: `HTTP ${res.status}` }
        }
    } catch (e: any) {
        return { success: false, msg: e.message || "请求失败" }
    }
}


// --- 子组件：可拖拽的列表项 ---
function SortableApiItem({
    api,
    onEdit,
    onDelete,
    onToggle,
    onTest
}: {
    api: ApiConfig,
    onEdit: (api: ApiConfig) => void,
    onDelete: (id: string) => void,
    onToggle: (id: string) => void,
    onTest: (api: ApiConfig) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: api.id })

    const [testState, setTestState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [testMsg, setTestMsg] = useState('')

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1
    }

    const handleLocalTest = async () => {
        setTestState('loading')
        const res = await testConnection(api)
        setTestState(res.success ? 'success' : 'error')
        setTestMsg(res.msg)

        // 3秒后重置状态
        setTimeout(() => {
            setTestState('idle')
            setTestMsg('')
        }, 3000)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition flex items-center justify-between group ${!api.isEnabled ? 'opacity-60 bg-muted' : ''}`}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                {/* 拖拽手柄 */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-muted-foreground hover:text-foreground touch-none p-1"
                >
                    <GripVertical size={20} />
                </div>

                {/* 启用/禁用开关 */}
                <button
                    onClick={() => onToggle(api.id)}
                    className={`p-1.5 rounded-full transition-colors ${api.isEnabled ? 'text-green-600 bg-green-500/10' : 'text-muted-foreground bg-muted'}`}
                    title={api.isEnabled ? "点击禁用" : "点击启用"}
                >
                    {api.isEnabled ? <Power size={18} /> : <PowerOff size={18} />}
                </button>

                <div className="min-w-0 flex-1 ml-2">
                    <div className="font-medium flex items-center gap-2 text-foreground">
                        <span className="truncate">{api.name}</span>
                        <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground border font-mono">
                            {api.provider}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[300px]">
                        {api.model}
                    </div>
                </div>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-1 ml-4">
                {/* 测试按钮及反馈 */}
                <div className="relative flex items-center">
                    {testState !== 'idle' && (
                        <span className={`text-xs mr-2 animate-in fade-in slide-in-from-right-2 ${testState === 'success' ? 'text-green-600' : 'text-red-500'
                            }`}>
                            {testMsg || (testState === 'loading' ? 'Testing...' : '')}
                        </span>
                    )}

                    <button
                        onClick={handleLocalTest}
                        disabled={testState === 'loading'}
                        title="测试连接"
                        className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded transition disabled:animate-spin"
                    >
                        {testState === 'loading' ? <Loader2 size={16} /> : <Play size={16} />}
                    </button>
                </div>

                <button
                    onClick={() => onEdit(api)}
                    title="编辑"
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition"
                >
                    <Pencil size={16} />
                </button>
                <button
                    onClick={() => onDelete(api.id)}
                    title="删除"
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}

// --- 主组件 ---
export const ApiSettings = () => {
    const [settings, setSettings] = useAppSettings()

    // UI State
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formTestStatus, setFormTestStatus] = useState<{ msg: string, type: 'success' | 'error' | 'loading' | null }>({ msg: '', type: null })

    // Form Data
    const [formData, setFormData] = useState<Partial<ApiConfig>>({
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-3.5-turbo",
        promptId: "default"
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over.id) {
            setSettings((prev) => {
                const oldIndex = prev.apiList.findIndex((item) => item.id === active.id)
                const newIndex = prev.apiList.findIndex((item) => item.id === over.id)
                return { ...prev, apiList: arrayMove(prev.apiList, oldIndex, newIndex) }
            })
        }
    }

    const handleEdit = (api: ApiConfig) => {
        setFormData({ ...api })
        setEditingId(api.id)
        setShowForm(true)
        setFormTestStatus({ msg: '', type: null })
    }

    const handleAdd = () => {
        setFormData({
            provider: "openai",
            baseUrl: "https://api.openai.com/v1",
            model: "gpt-3.5-turbo",
            apiKey: "",
            name: "",
            promptId: "default"
        })
        setEditingId(null)
        setShowForm(true)
        setFormTestStatus({ msg: '', type: null })
    }

    const handleSave = () => {
        if (!formData.name || !formData.apiKey) return alert("请填写名称和 API Key")

        setSettings(prev => {
            let newList = [...prev.apiList]
            if (editingId) {
                const index = newList.findIndex(item => item.id === editingId)
                if (index !== -1) newList[index] = { ...newList[index], ...formData } as ApiConfig
            } else {
                newList.push({ ...formData as ApiConfig, id: crypto.randomUUID(), isEnabled: true })
            }
            return { ...prev, apiList: newList }
        })
        setShowForm(false)
    }

    const handleDelete = (id: string) => {
        if (confirm("确定删除此 API 配置吗？")) {
            setSettings(prev => ({ ...prev, apiList: prev.apiList.filter(api => api.id !== id) }))
        }
    }

    // 新增：处理开关切换
    const handleToggle = (id: string) => {
        setSettings(prev => ({
            ...prev,
            apiList: prev.apiList.map(api =>
                api.id === id ? { ...api, isEnabled: !api.isEnabled } : api
            )
        }))
    }

    // 表单内的测试逻辑
    const handleFormTest = async () => {
        setFormTestStatus({ msg: "正在连接...", type: 'loading' })
        const res = await testConnection(formData)
        setFormTestStatus({
            msg: res.success ? `连接成功: ${res.msg}` : `失败: ${res.msg}`,
            type: res.success ? 'success' : 'error'
        })
    }

    if (!settings) return null

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-foreground">API 服务管理</h2>
                    <p className="text-xs text-muted-foreground mt-1">拖拽可调整优先级。启用多个 API 时支持故障自动切换。</p>
                </div>
                <button
                    onClick={handleAdd}
                    disabled={showForm}
                    className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 disabled:opacity-50 transition"
                >
                    <Plus size={16} /> 添加 API
                </button>
            </div>

            {/* 列表视图 */}
            {!showForm && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={settings.apiList.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {settings.apiList.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50">
                                    暂无 API 配置，请点击右上角添加。
                                </div>
                            )}
                            {settings.apiList.map((api) => (
                                <SortableApiItem
                                    key={api.id}
                                    api={api}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggle={handleToggle}
                                    onTest={() => { }}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* 编辑/新增表单 */}
            {showForm && (
                <div className="border border-primary/20 rounded-xl p-6 bg-card shadow-lg animate-in fade-in slide-in-from-top-4 relative">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h3 className="font-semibold text-foreground">{editingId ? '编辑 API' : '新增 API'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground px-2">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 sm:col-span-1">
                            <Input
                                label="显示名称" placeholder="例如: ChatGPT Main"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">提供商类型</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                value={formData.provider}
                                onChange={e => setFormData({ ...formData, provider: e.target.value as any })}
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="custom">Custom / Local LLM</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <Input
                                label="API Key" type="password" placeholder="sk-..."
                                value={formData.apiKey || ''}
                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                className="font-mono"
                            />
                        </div>

                        <Input
                            label="Base URL"
                            value={formData.baseUrl || ''}
                            onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                            className="font-mono text-xs"
                        />
                        <Input
                            label="Model Name" placeholder="gpt-3.5-turbo"
                            value={formData.model || ''}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            className="font-mono text-xs"
                        />

                        {/* 提示词选择下拉框 */}
                        <div className="col-span-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground flex justify-between">
                                    <span>关联提示词 (Prompt)</span>
                                    <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => alert('请在左侧菜单切换到“AI 提示词”进行管理')}>管理提示词</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                    value={formData.promptId || DEFAULT_PROMPT_ID}
                                    onChange={e => setFormData({ ...formData, promptId: e.target.value })}
                                >
                                    {settings.prompts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.isDefault ? '(默认)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground">
                                    该 API 将使用此系统指令进行翻译。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8 pt-4 border-t items-center">
                        {/* 状态反馈 */}
                        <div className="flex items-center gap-2 text-sm min-h-[20px]">
                            {formTestStatus.type === 'loading' && <span className="text-blue-600 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> 测试中...</span>}
                            {formTestStatus.type === 'success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> {formTestStatus.msg}</span>}
                            {formTestStatus.type === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {formTestStatus.msg}</span>}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleFormTest}
                                className="px-4 py-2 text-sm border bg-background text-foreground rounded-md hover:bg-muted flex items-center gap-2 transition"
                            >
                                <Play size={14} /> 测试连接
                            </button>
                            <button onClick={handleSave} className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-sm transition">
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}