import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { DEFAULT_SETTINGS, type AppSettings } from "./types"

// 初始化存储实例
export const storage = new Storage({
    area: "local" // 使用本地存储，容量大
})

// React Hook: 用于在组件中读取和修改设置
// 用法: const [settings, setSettings] = useAppSettings();
export const useAppSettings = () => {
    return useStorage<AppSettings>("app-settings", (saved) => {
        // 深度合并默认值，防止新版本增加字段时报错
        return { ...DEFAULT_SETTINGS, ...(saved || {}) }
    })
}

// Helper: 非 React 环境下获取设置 (例如在 background script 中)
export const getAppSettings = async (): Promise<AppSettings> => {
    const saved = await storage.get<AppSettings>("app-settings")
    return { ...DEFAULT_SETTINGS, ...(saved || {}) }
}