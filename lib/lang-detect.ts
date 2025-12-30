import { franc } from "franc-min"

// ISO 639-3 (franc) 到 ISO 639-1 (App) 的映射
const LANG_MAP: Record<string, string> = {
    'cmn': 'zh-CN', // Mandarin
    'zho': 'zh-CN', // Chinese
    'eng': 'en',
    'jpn': 'ja',
    'kor': 'ko',
    'fra': 'fr',
    'deu': 'de',
    'spa': 'es',
    'rus': 'ru',
    // 可以按需添加更多
}

export const detectLanguage = (text: string): string => {
    // text 长度太短 franc 可能会不准，但对于翻译场景够用了
    const detected3 = franc(text, { minLength: 3 })

    // 如果检测不出 ('und')，默认回退到英文或保持 auto
    if (detected3 === 'und') return 'auto'

    return LANG_MAP[detected3] || 'auto'
}