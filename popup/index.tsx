import { useState, useRef, useEffect } from "react"
import { useAppSettings } from "~lib/storage"
import { sendToBackground } from "@plasmohq/messaging"
import "~style.css"

function IndexPopup() {
  const [settings] = useAppSettings()
  const [inputText, setInputText] = useState("Hello world, this is a test.")
  const [result, setResult] = useState("")
  const [status, setStatus] = useState("idle")

  // 保持端口引用的 Ref
  const portRef = useRef<chrome.runtime.Port | null>(null)

  // 处理翻译
  const handleTranslate = () => {
    setResult("")
    setStatus("connecting...")

    // 1. 建立连接
    const port = chrome.runtime.connect({ name: "TRANSLATION_CHANNEL" })
    portRef.current = port

    // 2. 发送请求
    port.postMessage({
      action: "TRANSLATE",
      payload: {
        text: inputText,
        targetLang: settings.targetLang1
      }
    })

    // 3. 监听回复
    port.onMessage.addListener((msg) => {
      if (msg.action === "START") {
        setStatus(`正在使用: ${msg.apiName}...`)
      }
      else if (msg.action === "CHUNK") {
        setResult(prev => prev + msg.chunk)
      }
      else if (msg.action === "DONE") {
        setStatus("翻译完成")
        // 这里不需要主动断开，保持连接直到窗口关闭也是可以的
        // port.disconnect() 
      }
      else if (msg.action === "ERROR") {
        setStatus(`错误: ${msg.message}`)
        setResult(prev => prev + `\n[Error: ${msg.message}]`)
      }
    })
  }

  // 处理 ping 测试
  const handlePing = async () => {
    setStatus("Sending ping...")
    const resp = await sendToBackground({
      name: "ping",
      body: {
        id: 12345,
        inputText: inputText
      }
    })
    setStatus(`Received response: ${resp.message}`)
    console.log(`${resp.message}`);

  }

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      if (portRef.current) portRef.current.disconnect()
    }
  }, [])

  return (
    <div className="w-80 p-4 flex flex-col gap-4 bg-gray-50 h-[400px]">
      <h2 className="font-bold text-blue-600">测试后台服务</h2>

      <textarea
        className="w-full p-2 border rounded text-sm"
        rows={3}
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />

      <button
        onClick={handleTranslate}
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        开始翻译
      </button>

      <button
        onClick={handlePing}
        className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        test ping
      </button>

      <div className="text-xs text-gray-500">状态: {status}</div>

      <div className="flex-1 border rounded bg-white p-2 overflow-auto text-sm whitespace-pre-wrap">
        {result}
      </div>
    </div>
  )
}

export default IndexPopup