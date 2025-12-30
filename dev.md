这是一个非常完善且目标明确的需求描述。基于你提供的功能列表和技术栈，我已经为你整理了一份详细的开发文档（Development Design Document）。这份文档将指导你使用 Plasmo 和相关技术栈进行开发。

---

# 浏览器自定义 LLM 翻译插件开发文档

## 1. 项目概述

本项目旨在开发一款基于 Manifest V3 的轻量级浏览器翻译插件（Chrome/Firefox）。插件的核心理念是"用户自带模型（BYOM）"，允许用户配置自定义的 LLM API（OpenAI, Claude, Gemini, 或兼容 OpenAI 格式的本地模型等）进行文本翻译。核心交互模仿 Simple Translation，但底层能力由 LLM 驱动。

**技术栈：**

* **核心框架**: Plasmo Framework (React + TypeScript + Vite)
* **UI 组件库**: Tailwind CSS + Shadcn UI (推荐用于复杂的设置页) 或 Headless UI
* **图标**: Lucide React
* **Markdown**: react-markdown
* **状态/存储**: `@plasmohq/storage` (封装好的 LocalStorage/SyncStorage)
* **拖拽排序**: `@dnd-kit/core` 或 `dnd-kit` (用于 API 排序)

---

## 2. 核心架构设计

为了理解各个模块如何交互，我们可以参考 Chrome 扩展的架构模式。

在本项目中：

1. **Content Script (CSUI)**: 负责“划词翻译”的 UI（按钮和面板），通过 Shadow DOM 注入页面，避免样式冲突。
2. **Popup**: 点击浏览器图标后的独立弹窗。
3. **Options Page**: 全屏设置页面。
4. **Background Service Worker**: 核心逻辑层。负责持有 API Key（相对安全），处理 LLM 的流式请求，执行“API 自动切换/重试”逻辑，并管理历史记录。

---

## 3. 功能需求详细说明 (FR)

### 3.1 划词翻译 (Content Script)

* **触发机制**: 监听 `mouseup` 事件。
* **图标模式**: 选中文本 -> 计算坐标 -> 显示图标 -> 点击 -> 发送翻译请求 -> 展开面板 -> 显示流式结果。
* **直接面板模式**: 选中文本 -> 立即发送请求 -> 显示面板 -> 显示流式结果。
* **交互细节**:
* 点击面板外部 (`useClickAway`) -> 关闭面板。
* 面板打开状态下选中新文本 -> 销毁旧面板 -> 在新位置渲染新面板。
* **定位算法**: 需处理视口边缘（Viewport Edges），防止面板超出屏幕。



### 3.2 窗口翻译 (Popup)

* **输入区**: `textarea`，支持自动高度。
* **防抖 (Debounce)**: 自动翻译开启时，输入停止 `X` ms (如 800ms) 后触发请求。
* **流式渲染**: 接收 Background 发送的 Server-Sent Events (SSE) 或分块消息。

### 3.3 核心翻译逻辑 (Background)

* **语言检测**: 使用轻量级库（推荐 `franc-min` 或 `eld`）判断源语言。
* **目标语言路由**:
* `if (SourceLang == TargetLang1) return TargetLang2;`
* `else return TargetLang1;`


* **API 故障转移 (Failover)**:
* 获取 API 列表。
* 尝试 API[0] -> 失败/超时 -> 尝试 API[1] -> ... -> 全部失败 -> 返回错误。


* **Prompt 组装**: 解析用户定义的 System Prompt，替换变量 `{text}`, `{source_lang}`, `{target_lang}`。

---

## 4. 数据结构设计 (TypeScript Interfaces)

这是代码实现的基石，定义了数据如何在组件间流转。

### 4.1 核心配置与 API

```typescript
// LLM 提供商类型
export type LLMProvider = 'openai' | 'azure' | 'anthropic' | 'gemini' | 'custom';

// 单个 API 配置节点
export interface ApiConfig {
  id: string; // uuid
  name: string; // 用户自定义名称
  provider: LLMProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  promptId: string; // 关联的 System Prompt ID
  isEnabled: boolean; // 是否启用
}

// System Prompt 配置
export interface PromptConfig {
  id: string; // uuid
  name: string;
  content: string; // 包含 {text} 等变量的模板
}

```

### 4.2 全局设置 (Storage)

```typescript
export interface AppSettings {
  // 界面设置
  theme: 'light' | 'dark' | 'system';
  
  // 语言设置
  targetLang1: string; // ISO 代码, 如 'zh-CN'
  targetLang2: string; // ISO 代码, 如 'en'
  autoSwapLang: boolean; // 是否自动切换目标语言

  // API 策略
  apiList: ApiConfig[]; // 也就是用户配置的 API 列表，顺序即优先级
  autoSwitchApi: boolean; // 是否开启故障转移
  
  // 划词翻译 UI 设置
  selectionMode: 'icon' | 'panel' | 'off'; // 显示图标、直接显示面板、或关闭
  iconPosition: 'top-right' | 'bottom-right' | ... ; // 8个方向
  iconOffset: number; // px
  panelStyle: {
    width: number;
    height: number;
    fontSize: number;
    position: 'top' | 'bottom'; // 相对文本位置
  };

  // Popup 设置
  popupAutoTranslate: boolean;
  popupDebounceTime: number; // ms
  
  // 历史记录
  historyEnabled: boolean;
  historyLimit: number;
  cacheEnabled: boolean; // 是否对相同输入直接返回缓存
}

```

### 4.3 翻译历史与缓存

```typescript
export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  apiUsed: string; // 记录用的哪个 API
}

```

### 4.4 消息传递 (Messaging Protocol)

用于 Content Script/Popup 与 Background 通信。

```typescript
// 请求
export type TranslationRequest = {
  action: 'TRANSLATE';
  payload: {
    text: string;
    trigger: 'selection' | 'popup'; 
  };
};

// 响应 (流式)
export type TranslationResponseChunk = {
  status: 'loading' | 'streaming' | 'completed' | 'error';
  chunk?: string; // 增量文本
  fullText?: string; // 仅在 completed 时可能需要
  errorMsg?: string;
  apiInfo?: { name: string; model: string }; // 用于 UI 显示当前使用的 API
};

```

---

## 5. 页面与 UI 设计详细说明

### 5.1 设置页面 (Options Page)

* **布局**: 左右分栏 (Sidebar Layout)。
* **左侧导航**:
* 常规 (General): 主题、语言设置。
* API 管理 (API Services): **核心复杂区**。
* 提示词 (Prompts): 管理 System Prompts。
* 划词设置 (Selection): 图标与面板样式。
* 高级 (Advanced): 历史记录、缓存、导入导出。


* **API 管理交互**:
* 使用拖拽组件展示 API 卡片列表。
* 每个卡片包含：名称、状态点(绿色/红色表示连通性)、编辑按钮、删除按钮。
* "测试连接"按钮：点击后，Background 发起一个简单的 Hello 请求验证 Key。



*(此图用于参考 API 列表的拖拽排序交互效果)*

### 5.2 翻译面板 (In-Page Overlay)

* **实现方式**: 使用 Plasmo 的 `CSUI` (Content Script UI)。
* **Shadow DOM**: 必须开启，防止网页 CSS 污染插件样式。
* **布局**:
* **Header**:
* 左侧: 拖拽手柄 (Drag Handle)。
* 中间: 显示 API 名称 (小字号, 灰色)。
* 右侧: 复制按钮、关闭按钮。


* **Body**:
* 原文 (可折叠/只显示前两行)。
* **译文区**: Markdown 渲染组件。如果状态是 `loading`，显示 Skeleton (骨架屏) 或 Spinner。


* **Footer** (可选): 如果不是自动翻译，显示“翻译”按钮。



### 5.3 Popup 页面

* 简洁的 Flex-col 布局。
* 上部: `LanguageSelector` (源 -> 目标)。
* 中部: `TextArea` (输入)。
* 下部: `MarkdownViewer` (输出)。
* 底部: 状态栏 (显示 API 状态，或错误信息)。

---

## 6. 关键代码逻辑实现方案

### 6.1 LLM 调用与流式处理

不要在 Content Script 中直接调用 LLM API (会有 CORS 问题且暴露 Key)。所有请求在 **Background Service Worker** 中发起。

```typescript
// background/index.ts 伪代码
async function handleTranslation(text: string, config: AppSettings) {
  const apis = config.autoSwitchApi ? config.apiList : [config.apiList[0]];
  
  for (const api of apis) {
    try {
      if (!api.isEnabled) continue;
      // 1. 准备 Prompt
      const systemPrompt = getPrompt(api.promptId).replace(...);
      
      // 2. 调用 fetch (使用流式)
      const stream = await fetchLLMStream(api, systemPrompt, text);
      
      // 3. 读取流并通过 chrome.runtime.connect 发送给前端
      for await (const chunk of stream) {
        port.postMessage({ status: 'streaming', chunk });
      }
      return; // 成功则退出循环
    } catch (e) {
      console.error(`API ${api.name} failed`, e);
      // 继续下一次循环 (Failover)
    }
  }
  // 如果循环结束还没返回，发送错误
  port.postMessage({ status: 'error', errorMsg: '所有 API 均不可用' });
}

```

### 6.2 语言检测与自动切换

建议使用 `franc-min` (体积小) 或浏览器自带的检测 API (如果可用, Chrome 有实验性的 Translation API，但为了兼容性建议用第三方库)。

```typescript
import { franc } from 'franc-min';

function determineTargetLang(text: string, config: AppSettings): string {
  const detected = franc(text); // 返回 'cmn', 'eng' 等 3 字母代码
  // 需建立 ISO-639-1 (zh) 和 ISO-639-3 (cmn) 的映射
  const detectedIso2 = map3to2(detected); 
  
  if (config.autoSwapLang && detectedIso2 === config.targetLang1) {
    return config.targetLang2;
  }
  return config.targetLang1;
}

```

### 6.3 导入导出

直接利用 JSON 序列化 `AppSettings`。

* **导出**: `const data = JSON.stringify(await storage.getAll())` -> 创建 Blob -> 下载。
* **导入**: 读取文件 -> `JSON.parse` -> 校验 Schema -> `storage.setAll(data)`.

---

## 7. 开发路线建议

1. **Phase 1: 基础框架搭建**:
* 初始化 Plasmo 项目。
* 配置 Tailwind 和 Shadcn UI。
* 实现 Options Page 的 UI 骨架。


2. **Phase 2: 核心设置与存储**:
* 实现 API 列表的增删改查 (CRUD) 和存储，包括UI界面中的拖拽排序。
* 实现 API 连接测试功能。


3. **Phase 3: Background 服务**:
* 封装 OpenAI 格式的流式请求函数。
* 实现 API 轮询/故障转移逻辑。


4. **Phase 4: UI 集成**:
* 开发 Popup 界面，联调 Background 翻译接口。
* 开发 Content Script (划词图标 + 面板)，处理 DOM 定位。


5. **Phase 5: 优化与修饰**:
* 添加 Markdown 渲染。
* 实现历史记录和缓存。
* 暗黑模式适配。
* 打包发布测试。



你现在可以基于这个文档开始搭建项目了。