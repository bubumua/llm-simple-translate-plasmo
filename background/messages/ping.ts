import type { PlasmoMessaging } from "@plasmohq/messaging"

const TEST_PING_URL = "https://www.dmxapi.cn/v1"
const COMPLETION_ENDPOINT = "/chat/completions"
const API_KEY = "sk-c59pZL02vooU8mGjupkwoS5lV4DZU5NiOwSX0dcCnHFgPssq"
const MODEL = "Hunyuan-MT-7B"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    let messageFromBg = ""
    if (req.name !== "ping") {
        messageFromBg += `Unexpected message name: ${req.name}`
    } else {
        messageFromBg += req.body?.id ? `Received ID: ${req.body.id}` : "No ID received"
    }

    messageFromBg += "\nStarting ping test to LLM API..."
    const inputText = req.body?.inputText || "Hello"
    try {
        const response = await fetch(TEST_PING_URL + COMPLETION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "user", content: inputText }
                ],
                stream: false,
                temperature: 0.3
            })
        })
        if (response.ok) {
            const data = await response.json()
            messageFromBg += `\nPing successful! Received response from LLM API.`
            console.log("LLM API response:", data)
        } else {
            messageFromBg += `\nPing failed with status: ${response.status}`
        } 
    } catch (error: any) {
        messageFromBg += `\nPing error: ${error.message}`
    }

    res.send({
        message: messageFromBg
    })
}

export default handler