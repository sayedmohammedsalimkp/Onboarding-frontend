"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SimpleFormattedContent } from "@/lib/format-content"
import { Volume2, Square } from "lucide-react"

export default function ChapterPage() {
  const router = useRouter()
  const { documentId, chapterId } = useParams()
  const [chapter, setChapter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const partIndexRef = useRef(0)
  const audioPartsRef = useRef<string[]>([])

  useEffect(() => { 
  if (chapterId && chapterId !== "undefined") {
    fetchChapter() 
  }
}, [chapterId])

  const fetchChapter = async () => {
    try {
      const res = await api.get(`/chapters/${chapterId}`)
      setChapter(res.data)
    } catch { router.push("/learn") }
    finally { setLoading(false) }
  }

  const stopTts = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setTtsPlaying(false)
  }

  const getChapterPlainText = (): string => {
    if (!chapter) return ""
    if (chapter.content_blocks?.length) {
      return chapter.content_blocks
        .map((b: any) =>
          b.type === "points" ? (b.items || []).join(". ") : (b.content || "")
        )
        .filter(Boolean)
        .join("\n\n")
    }
    return chapter.content || ""
  }

  const playWithBrowserTts = (text: string) => {
    if (!text.trim() || typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Your browser doesn't support speech")
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.trim())
    u.onend = () => setTtsPlaying(false)
    u.onerror = () => setTtsPlaying(false)
    window.speechSynthesis.speak(u)
    setTtsPlaying(true)
  }

  const playNextPart = () => {
    const parts = audioPartsRef.current
    const idx = partIndexRef.current
    if (idx >= parts.length) {
      setTtsPlaying(false)
      return
    }
    const base64 = parts[idx]
    const audio = new Audio(`data:audio/wav;base64,${base64}`)
    audioRef.current = audio
    partIndexRef.current = idx + 1
    audio.onended = () => playNextPart()
    audio.onerror = () => {
      if (idx + 1 < parts.length) playNextPart()
      else setTtsPlaying(false)
    }
    audio.play().catch(() => setTtsPlaying(false))
  }

  const handleListen = async () => {
    if (ttsPlaying) {
      stopTts()
      return
    }
    if (!chapterId || !chapter) return
    const plainText = getChapterPlainText()
    if (!plainText.trim()) {
      toast.error("No content to read aloud")
      return
    }
    setTtsLoading(true)
    try {
      const res = await api.get(`/chapters/${chapterId}/speech`)
      const parts = res.data?.audio_parts || []
      if (parts.length === 0) {
        playWithBrowserTts(plainText)
        toast.info("Using browser voice (server returned no audio)")
        return
      }
      audioPartsRef.current = parts
      partIndexRef.current = 0
      setTtsPlaying(true)
      playNextPart()
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Could not generate audio"
      toast.info("Using browser voice instead")
      playWithBrowserTts(plainText)
    } finally {
      setTtsLoading(false)
    }
  }

  useEffect(() => {
    return () => stopTts()
  }, [])

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await api.post(`/chapters/${chapterId}/complete`)
      toast.success("Chapter marked as complete!")
      router.push(`/quiz/${chapterId}?documentId=${documentId}`)
    } catch (err: any) {
      toast.error("Something went wrong")
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/learn")}>
          Train<span className="text-indigo-400">IQ</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push(`/learn/${documentId}`)} className="text-slate-400 hover:text-white">
            ← Chapters
          </Button>
          <Button variant="ghost" onClick={() => router.push("/assistant")} className="text-slate-400 hover:text-white">
            AI Assistant
          </Button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="text-indigo-400 text-sm font-medium mb-2">Chapter {chapter?.order}</div>
          <h1 className="text-3xl font-bold">{chapter?.title}</h1>
          {chapter?.key_terms?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {chapter.key_terms.map((term: string) => (
                <span key={term} className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-1 rounded">
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-sm text-slate-400">Listen to this chapter</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleListen}
                disabled={ttsLoading}
                className={`border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 ${ttsPlaying ? "bg-indigo-950 border-indigo-700 text-indigo-300" : ""}`}
              >
                {ttsLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </span>
                ) : ttsPlaying ? (
                  <>
                    <Square className="w-4 h-4 mr-1.5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-1.5" />
                    Listen
                  </>
                )}
              </Button>
            </div>
            <div className="prose prose-invert prose-slate max-w-none space-y-4">
              {chapter?.content_blocks?.length > 0 ? (
                chapter.content_blocks.map((block: any, i: number) => (
                  block.type === "subheading" && (
                    <h3 key={i} className="text-lg font-semibold text-white mt-6 mb-2 first:mt-0">
                      {block.content}
                    </h3>
                  ) ||
                  block.type === "paragraph" && (
                    <p key={i} className="text-slate-300 leading-relaxed text-base">
                      {block.content}
                    </p>
                  ) ||
                  block.type === "points" && (
                    <ul key={i} className="list-disc list-inside text-slate-300 space-y-1.5 pl-2">
                      {(block.items || []).map((item: string, j: number) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ) || null
                ))
              ) : (
                <SimpleFormattedContent
                  content={chapter?.content ?? ""}
                  className="space-y-4"
                  paragraphClassName="text-slate-300 leading-relaxed text-base"
                  headingClassName="text-lg font-semibold text-white mt-6 mb-2 first:mt-0"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
            {completing ? "Saving..." : "I've Read This → Take Quiz"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/quiz/${chapterId}?documentId=${documentId}`)}
            className="border-slate-700 text-slate-400 hover:text-white">
            Skip to Quiz
          </Button>
        </div>
      </div>
    </div>
  )
}
