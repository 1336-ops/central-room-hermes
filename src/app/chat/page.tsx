"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User, Sparkles, ChevronDown, Zap, Eye, Image, Mic, Video, Brain, Code, Globe, Crown, Star, X, Settings2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Model capabilities database
const MODEL_CAPABILITIES: Record<string, { caps: string[], category: string, desc: string }> = {
  // Thinking & Reasoning
  "custom-apis-iflow-cn/deepseek-r1": { caps: ["reasoning"], category: "Reasoning", desc: "Deep reasoning & complex problem solving" },
  "custom-apis-iflow-cn/qwen3-235b-a22b-thinking": { caps: ["reasoning"], category: "Reasoning", desc: "Advanced chain-of-thought reasoning" },
  "nvidia/moonshotai/kimi-k2-thinking": { caps: ["reasoning"], category: "Reasoning", desc: "Deep thinking with Kimi K2" },
  // Coding
  "custom-apis-iflow-cn/qwen3-coder-plus": { caps: ["code"], category: "Coding", desc: "Specialized code generation & review" },
  "openrouter/qwen/qwen3-coder:free": { caps: ["code"], category: "Coding", desc: "Open source coding assistant" },
  "nvidia/qwen/qwen3-coder-480b-a35b-instruct": { caps: ["code"], category: "Coding", desc: "Massive 480B coding model" },
  "nvidia/mistralai/devstral-2-123b-instruct-2512": { caps: ["code"], category: "Coding", desc: "Developer-focused Mistral variant" },
  // Vision & Multimodal
  "custom-apis-iflow-cn/kimi-k2-0905": { caps: ["vision", "code"], category: "Multimodal", desc: "Vision + code + reasoning (Kimi K2)" },
  "custom-ai-semutssh-com/kimi-k2-thinking": { caps: ["vision", "reasoning"], category: "Multimodal", desc: "Kimi K2 with thinking + vision" },
  "custom-ai-semutssh-com/gemini-3.1-pro-preview": { caps: ["vision", "audio", "code"], category: "Multimodal", desc: "Google Gemini Pro — vision + audio" },
  "sumopod/mimo-v2-omni": { caps: ["vision", "audio"], category: "Multimodal", desc: "Omni-modal: vision + audio understanding" },
  // Audio/Speech
  "sumopod/minimax/speech-2.8-hd": { caps: ["audio", "tts"], category: "Audio", desc: "High-quality text-to-speech" },
  // General (flagship)
  "custom-apis-iflow-cn/deepseek-v3-671b": { caps: ["code", "reasoning"], category: "Flagship", desc: "671B MoE — flagship general purpose" },
  "custom-apis-iflow-cn/deepseek-v3-2-exp": { caps: ["code", "reasoning"], category: "Flagship", desc: "DeepSeek V3 experimental" },
  "custom-apis-iflow-cn/qwen3-max": { caps: ["code", "reasoning"], category: "Flagship", desc: "Qwen3 maximum capability" },
  "custom-ai-semutssh-com/claude-sonnet-4-6": { caps: ["code", "reasoning", "vision"], category: "Flagship", desc: "Claude Sonnet 4 — balanced power" },
  "custom-ai-semutssh-com/claude-opus-4-6": { caps: ["code", "reasoning", "vision"], category: "Flagship", desc: "Claude Opus 4 — maximum intelligence" },
  "custom-ai-semutssh-com/glm-4.7": { caps: ["code", "vision"], category: "Flagship", desc: "GLM-4 — bilingual CN/EN flagship" },
  "custom-ai-semutssh-com/minimax-m2.5": { caps: ["code", "reasoning"], category: "Flagship", desc: "MiniMax M2.5 — strong reasoning" },
  "nvidia/deepseek-ai/deepseek-v3_2": { caps: ["code", "reasoning"], category: "Flagship", desc: "DeepSeek V3.2 via NVIDIA" },
  // Free tier
  "openrouter/openai/gpt-oss-120b:free": { caps: ["code"], category: "Free", desc: "OpenAI GPT OSS 120B — free" },
  "openrouter/google/gemma-4-31b-it:free": { caps: ["code"], category: "Free", desc: "Google Gemma 4 31B — free" },
  "openrouter/nousresearch/hermes-3-llama-3.1-405b:free": { caps: ["code"], category: "Free", desc: "Hermes 3 405B — free" },
  "sumopod/nemotron-3-super-free": { caps: ["code"], category: "Free", desc: "Nemotron-3 Super — free" },
  "sumopod/seed-2-0-pro-free": { caps: ["code"], category: "Free", desc: "Seed 2.0 Pro — free" },
  "sumopod/seed-2-0-mini-free": { caps: ["code"], category: "Free", desc: "Seed 2.0 Mini — fast & free" },
  "sumopod/gpt-5-mini-free": { caps: ["code", "reasoning"], category: "Free", desc: "GPT-5 Mini Free via Sumopod" },
  "sumopod/gemma-4-31b-free": { caps: ["code"], category: "Free", desc: "Gemma 4 31B Free via Sumopod" },
  // Translation
  "nvidia/nvidia/riva-translate-4b-instruct-v1_1": { caps: ["translation"], category: "Translation", desc: "Riva multilingual translation" },
}

function getCapabilities(modelId: string): string[] {
  return MODEL_CAPABILITIES[modelId]?.caps || ["code"]
}

function getCategory(modelId: string): string {
  return MODEL_CAPABILITIES[modelId]?.category || "General"
}

function getDescription(modelId: string): string {
  return MODEL_CAPABILITIES[modelId]?.desc || modelId.split("/").pop() || modelId
}

function getCapIcon(cap: string) {
  switch (cap) {
    case "vision": return <Eye className="h-3 w-3" />
    case "image": return <Image className="h-3 w-3" />
    case "audio": return <Mic className="h-3 w-3" />
    case "tts": return <Mic className="h-3 w-3 text-purple-400" />
    case "video": return <Video className="h-3 w-3" />
    case "reasoning": return <Brain className="h-3 w-3" />
    case "code": return <Code className="h-3 w-3" />
    case "translation": return <Globe className="h-3 w-3" />
    default: return <Zap className="h-3 w-3" />
  }
}

function getCapColor(cap: string) {
  switch (cap) {
    case "vision": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "image": return "bg-pink-500/20 text-pink-400 border-pink-500/30"
    case "audio": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "tts": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "video": return "bg-red-500/20 text-red-400 border-red-500/30"
    case "reasoning": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    case "code": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "translation": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
  }
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case "Flagship": return "text-amber-400 bg-amber-500/10 border-amber-500/30"
    case "Reasoning": return "text-orange-400 bg-orange-500/10 border-orange-500/30"
    case "Coding": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    case "Multimodal": return "text-blue-400 bg-blue-500/10 border-blue-500/30"
    case "Audio": return "text-purple-400 bg-purple-500/10 border-purple-500/30"
    case "Free": return "text-slate-400 bg-slate-500/10 border-slate-500/30"
    case "Translation": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/30"
  }
}

interface ModelInfo {
  id: string
  alias: string
  status: string
  caps?: string[]
  category?: string
  desc?: string
  isPrimary?: boolean
  isFallback?: boolean
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo Tuan Zack. Hermes Dashboard Agent Chat siap. Pilih model di bawah, lalu kirim pesan." }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [streaming, setStreaming] = useState(true)
  const [sessionKey] = useState(() => `webchat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modelPickerRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

  // Fetch available models (fast endpoint, no live testing)
  useEffect(() => {
    fetch("/dashboard/api/models-list")
      .then(r => r.json())
      .then(data => {
        const allModels = (data.models || []).map((m: any) => ({
          id: m.id,
          alias: m.alias,
          status: m.lastStatus,
          caps: m.caps,
          category: m.category,
          desc: m.desc,
          isPrimary: m.isPrimary,
          isFallback: m.isFallback,
        }))
        setModels(allModels)
        // Auto-select primary or first
        const primary = allModels.find((m: any) => m.isPrimary)
        if (primary) setSelectedModel(primary.id)
        else if (allModels.length > 0) setSelectedModel(allModels[0].id)
      })
      .catch(() => { })
  }, [])

  // Close model picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Auto-scroll hanya jika user sudah di dekat bawah (100px)
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setAutoScrollEnabled(isNearBottom)
    }
    container.addEventListener('scroll', onScroll)
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (autoScrollEnabled) {
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, autoScrollEnabled])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return

    const userMsg = input.trim()
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }]
    setMessages(newMessages)
    setInput("")
    setIsTyping(true)

    // Add empty assistant message for streaming
    if (streaming) {
      setMessages(prev => [...prev, { role: "assistant", content: "" }])
    }

    try {
      const payload: any = {
        messages: newMessages,
        stream: streaming,
        sessionKey,
        maxTokens: 4096,
        temperature: 0.7,
      }

      // Set backend model override
      if (selectedModel) {
        payload.backendModel = selectedModel
      }

      const res = await fetch("/dashboard/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      if (streaming && res.headers.get("content-type")?.includes("text/event-stream")) {
        // Handle SSE streaming
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim()
                if (data === "[DONE]") break

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ""
                  if (content) {
                    setMessages(prev => {
                      const updated = [...prev]
                      const last = updated[updated.length - 1]
                      if (last?.role === "assistant") {
                        updated[updated.length - 1] = { ...last, content: last.content + content }
                      }
                      return updated
                    })
                  }
                } catch { }
              }
            }
          }
        }
      } else {
        // Non-streaming
        const data = await res.json()
        const reply = data.choices?.[0]?.message?.content || "Tidak ada respons."
        setMessages(prev => [...prev, { role: "assistant", content: reply }])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Error: ${e.message}\n\nPastikan gateway berjalan dan model "${selectedModel}" online.`
      }])
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }, [input, isTyping, messages, selectedModel, streaming, sessionKey])

  const selectedModelInfo = models.find(m => m.id === selectedModel)
  const selectedCaps = selectedModel ? (selectedModelInfo?.caps || getCapabilities(selectedModel)) : []

  // Group models by category
  const groupedModels = models.reduce((acc, m) => {
    const cat = m.category || getCategory(m.id)
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {} as Record<string, typeof models>)

  const categoryOrder = ["Flagship", "Reasoning", "Coding", "Multimodal", "Audio", "Translation", "Free", "General"]

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-grid">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Agent Chat</h2>
          <p className="text-sm text-slate-500 mt-0.5">Chat langsung via Hermes Dashboard — alternatif saat Telegram laggy</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreaming(!streaming)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              streaming
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
            )}
          >
            {streaming ? "⚡ Streaming" : "⏸ Buffered"}
          </button>
        </div>
      </div>

      <Card className="glass-card border-slate-800/50 flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Model Selector Bar */}
          <div className="p-3 border-b border-slate-800/50 bg-slate-900/40">
            <div className="relative" ref={modelPickerRef}>
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-white">
                      {selectedModelInfo?.alias || selectedModel.split("/").pop() || "Pilih Model"}
                    </span>
                  </div>
                  {selectedModel && (
                    <>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", getCategoryColor(getCategory(selectedModel)))}>
                        {getCategory(selectedModel)}
                      </span>
                      <div className="flex gap-1">
                        {selectedCaps.map(cap => (
                          <span key={cap} className={cn("px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-0.5", getCapColor(cap))}>
                            {getCapIcon(cap)}
                            {cap}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", showModelPicker && "rotate-180")} />
              </button>

              {/* Model Picker Dropdown */}
              {showModelPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
                  <div className="p-3">
                    <div className="text-xs text-slate-500 mb-2 px-2 flex items-center gap-1.5">
                      <Settings2 className="h-3 w-3" /> Pilih Model AI ({models.length} online)
                    </div>
                    {categoryOrder.map(cat => {
                      const catModels = groupedModels[cat]
                      if (!catModels?.length) return null
                      return (
                        <div key={cat} className="mb-3">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                            {cat === "Flagship" && <Crown className="h-3 w-3 text-amber-400" />}
                            {cat === "Free" && <Star className="h-3 w-3" />}
                            {cat}
                          </div>
                          <div className="space-y-1">
                            {catModels.map(m => {
                              const caps = m.caps || getCapabilities(m.id)
                              const isSelected = m.id === selectedModel
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => { setSelectedModel(m.id); setShowModelPicker(false) }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all",
                                    isSelected
                                      ? "bg-emerald-500/15 border border-emerald-500/30"
                                      : "hover:bg-slate-800/50 border border-transparent"
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("text-sm font-medium", isSelected ? "text-emerald-400" : "text-slate-200")}>
                                        {m.alias}
                                      </span>
                                      <span className="text-[10px] text-slate-500">{m.id.split("/").pop()}</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 mt-0.5">{m.desc || getDescription(m.id)}</span>
                                  </div>
                                  <div className="flex gap-1 shrink-0 ml-2">
                                    {caps.map(cap => (
                                      <span key={cap} className={cn("px-1.5 py-0.5 rounded text-[9px] border", getCapColor(cap))}>
                                        {getCapIcon(cap)}
                                      </span>
                                    ))}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Capability Legend */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap px-1">
              <span className="text-[10px] text-slate-600">Kemampuan:</span>
              {[
                { cap: "vision", label: "👁 Vision" },
                { cap: "audio", label: "🎤 Audio" },
                { cap: "tts", label: "🔊 TTS" },
                { cap: "video", label: "🎬 Video" },
                { cap: "reasoning", label: "🧠 Reasoning" },
                { cap: "code", label: "💻 Code" },
                { cap: "translation", label: "🌐 Translate" },
              ].map(({ cap, label }) => (
                <span key={cap} className={cn("px-1.5 py-0.5 rounded text-[9px] border", getCapColor(cap))}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3 max-w-[85%]", m.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                <div className={cn(
                  "p-2 rounded-xl shrink-0 h-8 w-8 flex items-center justify-center",
                  m.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50"
                )}>
                  {m.content || (isTyping && i === messages.length - 1 ? "▌" : "")}
                </div>
              </div>
            ))}
            {isTyping && streaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="p-2 rounded-xl shrink-0 h-8 w-8 flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
            <div className="relative flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={`Kirim pesan ke ${selectedModelInfo?.alias || "Agent"}...`}
                disabled={isTyping}
                className="w-full pl-4 pr-12 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Powered by Hermes Gateway
                {selectedModel && <span className="text-slate-600">•</span>}
                {selectedModel && <span className="text-slate-500">{selectedModel}</span>}
              </div>
              <span>Enter untuk kirim • Shift+Enter newline</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
