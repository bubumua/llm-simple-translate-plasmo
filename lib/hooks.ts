import { useEffect, useState } from "react"

/**
 * 自定义的防抖 Hook。
 * 仅当 delay 大于 0 时启用防抖；否则直接返回最新值。
 * @param value 需要防抖的值
 * @param delay 防抖延迟，单位毫秒。设置为 0 或负数表示关闭防抖。
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number = 800): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        // 只有当 delay 大于 0 时才启用防抖
        // 如果 delay 为 0 或负数 (代表关闭自动翻译)，则不更新 debouncedValue，由外部逻辑控制
        if (delay <= 0) return

        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}