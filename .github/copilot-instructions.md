# Copilot instructions for llmsimtran-plasmo

This repository is a Plasmo-based browser extension (TypeScript + React + Tailwind) that provides LLM-powered translation. Use these notes to generate, modify, or refactor code in a way that matches project conventions and developer workflows.

- Architecture: background service worker handles LLM calls and streams results to UI via a long-lived port. See [background/index.ts](background/index.ts#L1).
- UI: React components under `popup/` and `options/` talk to background via `chrome.runtime.connect` on the channel name "TRANSLATION_CHANNEL". See [popup/index.tsx](popup/index.tsx#L1) and [options/index.tsx](options/index.tsx#L1).
- LLM integration: `lib/llm.ts` implements streaming SSE parsing and calls `${api.baseUrl}/chat/completions` with `stream: true`. Preserve its SSE parsing approach and error/abort handling when changing streaming logic. See [lib/llm.ts](lib/llm.ts#L1).

- Settings storage: use `useAppSettings()` in React and `getAppSettings()` in non-React contexts. Storage is implemented with `@plasmohq/storage`. See [lib/storage.ts](lib/storage.ts#L1).
- ApiConfig shape and defaults are defined in [lib/types.ts](lib/types.ts#L1). When adding fields, update deep-merge in `useAppSettings` to avoid breaking saved settings.

- API selection strategy: background loops through `settings.apiList` and honors `settings.autoSwitchApi` for failover. Keep message actions stable: `START`, `CHUNK`, `DONE`, `ERROR`. See [background/index.ts](background/index.ts#L1) and [popup/index.tsx](popup/index.tsx#L1).

- Dev/build commands: use `pnpm dev` or `npm run dev` (launches `plasmo dev`). Build with `pnpm build`. Output for Chrome dev is `build/chrome-mv3-dev/`. See [README.md](README.md#L1) and `package.json` scripts.

- UI patterns and libraries: Tailwind utilities + `lucide-react` for icons. Drag-and-drop in API settings uses `@dnd-kit/*` (see [options/sections/ApiSettings.tsx](options/sections/ApiSettings.tsx#L1)). Keep styles in `style.css` and shared imports use path alias `~` (tsconfig configured).

- Network/CORS notes discoverable in repo: API test in UI calls `${baseUrl}/models` directly from the options page. For production or complex CORS proxies, prefer routing sensitive or cross-origin requests through the background worker.

- Cancellation: streaming calls accept an `AbortSignal`; background wires an `AbortController` to the `STOP` action and to port disconnect. Preserve these patterns when adding cancelable flows.

- When changing prompts: default prompt template lives in [lib/constants.ts](lib/constants.ts#L1) and is composed with `buildSystemPrompt`. If adding user prompts, update storage shape and ensure backward-compatible merging.

- Tests & linting: no tests present. Respect existing TypeScript types and keep imports consistent. Prettier and TypeScript are configured in `package.json` devDependencies.

Examples (use these shapes when generating code):

- Port message from UI to background (translate):

  { action: "TRANSLATE", payload: { text: string, targetLang: string } }

- Background streaming callback shape (from `streamLLM`):

  callbacks: { onMessage: (chunk) => void, onError: (err) => void, onFinish: () => void }

- ApiConfig minimal fields (see [lib/types.ts](lib/types.ts#L1)):

  { id, name, provider, baseUrl, apiKey, model, promptId, isEnabled }

If you need to make larger architectural changes (new background endpoints, different streaming protocol, or adding a server-side proxy), update `README.md` and the options UI to document configuration changes and migrations for `app-settings` stored in `@plasmohq/storage`.

If any section is unclear or you want more examples (message flows, component examples, or storage migration notes), tell me which area to expand.
