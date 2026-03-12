"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function AssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    fetchWorkspace()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchWorkspace = async () => {
    try {
      const res = await api.get("/workspaces/me")
      setWorkspaceId(res.data.id)
    } catch { router.push("/login") }
  }

  const handleSend = async () => {
    if (!input.trim() || !workspaceId) return
    const question = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: question }])
    setLoading(true)
    try {
      const res = await api.post("/assistant/ask", {
        question,
        workspace_id: workspaceId
      })
      setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }])
    } catch (err: any) {
      toast.error("Failed to get answer")
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push(role === "admin" ? "/admin/dashboard" : "/learn")}>
          Train<span className="text-indigo-400">IQ</span>
        </div>
        <Button variant="ghost"
          onClick={() => router.push(role === "admin" ? "/admin/dashboard" : "/learn")}
          className="text-slate-400 hover:text-white">
          ← Back
        </Button>
      </nav>

      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-slate-400 text-sm mt-1">Ask anything about your training material</p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto min-h-[400px]">
          {messages.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <div className="text-4xl mb-3">🤖</div>
              <div>Ask me anything about your training documents</div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <Input
            placeholder="Ask a question about the training material..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6">
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
