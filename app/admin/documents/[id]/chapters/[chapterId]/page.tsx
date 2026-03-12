"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SimpleFormattedContent } from "@/lib/format-content"
import { Volume2, Square, Pencil, Save, X, Bold, Italic, List, ListOrdered, Heading2, Trash2, PlusCircle } from "lucide-react"

function useTextareaToolbar(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (v: string) => void
) {
  const insertAtCursor = (before: string, after: string = "") => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = value
    const selected = text.slice(start, end)
    const newText = text.slice(0, start) + before + selected + after + text.slice(end)
    onChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + before.length + selected.length + after.length
    }, 0)
  }
  return {
    bold: () => insertAtCursor("**", "**"),
    italic: () => insertAtCursor("*", "*"),
    bullet: () => insertAtCursor("\n- ", ""),
    numbered: () => insertAtCursor("\n1. ", ""),
    heading: () => insertAtCursor("\n## ", ""),
  }
}

export default function AdminChapterDetailPage() {
  const router = useRouter()
  const { id, chapterId } = useParams()
  const [chapter, setChapter] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"content" | "quiz">("content")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editSummary, setEditSummary] = useState("")
  const [editKeyTerms, setEditKeyTerms] = useState("")
  const [editContent, setEditContent] = useState("")
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const toolbar = useTextareaToolbar(contentTextareaRef, editContent, setEditContent)

  const [deletingChapter, setDeletingChapter] = useState(false)
  const [addQuestionOpen, setAddQuestionOpen] = useState(false)
  const [newQ, setNewQ] = useState({ question: "", A: "", B: "", C: "", D: "", correct_answer: "A" as const, explanation: "" })
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  // TTS state
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const partIndexRef = useRef(0)
  const audioPartsRef = useRef<string[]>([])

  useEffect(() => { fetchData() }, [chapterId])

  const fetchData = async () => {
    if (!chapterId) return
    try {
      const chapterRes = await api.get(`/chapters/${chapterId}`)
      setChapter(chapterRes.data)
      setEditTitle(chapterRes.data?.title ?? "")
      setEditSummary(chapterRes.data?.summary ?? "")
      setEditKeyTerms(Array.isArray(chapterRes.data?.key_terms) ? chapterRes.data.key_terms.join(", ") : "")
      setEditContent(chapterRes.data?.content ?? "")

      try {
        const res = await api.get(`/quiz/admin/${chapterId}/questions`)
        setQuestions(Array.isArray(res.data) ? res.data : [])
      } catch {
        setQuestions([])
      }
    } catch { router.push(`/admin/documents/${id}`) }
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

  const getChapterPlainText = () => {
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
        toast.info("Using browser voice")
        return
      }
      audioPartsRef.current = parts
      partIndexRef.current = 0
      setTtsPlaying(true)
      playNextPart()
    } catch {
      toast.info("Using browser voice instead")
      playWithBrowserTts(plainText)
    } finally {
      setTtsLoading(false)
    }
  }

  useEffect(() => () => stopTts(), [])

  const handleSaveEdit = async () => {
    if (!chapterId) return
    setSaving(true)
    try {
      const key_terms = editKeyTerms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      await api.put(`/chapters/${chapterId}`, {
        title: editTitle,
        summary: editSummary,
        key_terms,
        content: editContent,
        content_blocks: null,
      })
      toast.success("Chapter updated")
      setEditing(false)
      await fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(chapter?.title ?? "")
    setEditSummary(chapter?.summary ?? "")
    setEditKeyTerms(Array.isArray(chapter?.key_terms) ? chapter.key_terms.join(", ") : "")
    setEditContent(chapter?.content ?? "")
    setEditing(false)
  }

  const handleDeleteChapter = async () => {
    if (!chapterId || !id || !confirm("Delete this chapter? Quiz questions will be deleted too.")) return
    setDeletingChapter(true)
    try {
      await api.delete(`/chapters/${chapterId}`)
      toast.success("Chapter deleted")
      router.push(`/admin/documents/${id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete")
    } finally {
      setDeletingChapter(false)
    }
  }

  const handleAddQuestion = async () => {
    if (!chapterId || !newQ.question.trim() || !newQ.A.trim() || !newQ.B.trim() || !newQ.C.trim() || !newQ.D.trim()) {
      toast.error("Fill question and all four options")
      return
    }
    setAddingQuestion(true)
    try {
      await api.post("/quiz/question", {
        chapter_id: chapterId,
        question: newQ.question.trim(),
        options: { A: newQ.A.trim(), B: newQ.B.trim(), C: newQ.C.trim(), D: newQ.D.trim() },
        correct_answer: newQ.correct_answer,
        explanation: newQ.explanation.trim() || undefined,
      })
      toast.success("Question added")
      setAddQuestionOpen(false)
      setNewQ({ question: "", A: "", B: "", C: "", D: "", correct_answer: "A", explanation: "" })
      const res = await api.get(`/quiz/admin/${chapterId}/questions`)
      setQuestions(Array.isArray(res.data) ? res.data : [])
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add question")
    } finally {
      setAddingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return
    setDeletingQuestionId(questionId)
    try {
      await api.delete(`/quiz/question/${questionId}`)
      setQuestions((prev) => prev.filter((q: any) => q.id !== questionId))
      toast.success("Question deleted")
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete")
    } finally {
      setDeletingQuestionId(null)
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
        <div className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/admin/dashboard")}>
          Train<span className="text-indigo-400">IQ</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push(`/admin/documents/${id}`)} className="text-slate-400 hover:text-white">
            ← Document
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteChapter}
            disabled={deletingChapter}
            className="border-red-800 text-red-400 hover:bg-red-950/50"
          >
            {deletingChapter ? "Deleting…" : "Delete chapter"}
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="text-indigo-400 text-sm mb-1">Chapter {chapter?.order}</div>
          {!editing ? (
            <>
              <h1 className="text-3xl font-bold">{chapter?.title}</h1>
              <p className="text-slate-400 mt-2">{chapter?.summary}</p>
              {chapter?.key_terms?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {chapter.key_terms.map((term: string) => (
                    <span key={term} className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-1 rounded">
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <label className="block text-sm text-slate-400">Summary</label>
              <Input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <label className="block text-sm text-slate-400">Key terms (comma-separated)</label>
              <Input
                value={editKeyTerms}
                onChange={(e) => setEditKeyTerms(e.target.value)}
                placeholder="term1, term2, term3"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 border-b border-slate-800">
          {["content", "quiz"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "content" | "quiz")}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "quiz" ? `Quiz Questions (${questions.length} total)` : "Chapter Content"}
            </button>
          ))}
        </div>

        {activeTab === "content" && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-sm text-slate-400">Listen to this chapter</span>
                <div className="flex items-center gap-2">
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
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="border-slate-600 text-slate-300 hover:text-white">
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
                        <Save className="w-4 h-4 mr-1.5" />
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="border-slate-600 text-slate-300">
                        <X className="w-4 h-4 mr-1.5" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {!editing ? (
                <div className="prose prose-invert prose-slate max-w-none space-y-4 text-sm">
                  {chapter?.content_blocks?.length > 0 ? (
                    chapter.content_blocks.map((block: any, i: number) => (
                      (block.type === "subheading" && (
                        <h3 key={i} className="text-base font-semibold text-white mt-4 mb-2 first:mt-0">
                          {block.content}
                        </h3>
                      )) ||
                      (block.type === "paragraph" && (
                        <p key={i} className="text-slate-300 leading-relaxed">
                          {block.content}
                        </p>
                      )) ||
                      (block.type === "points" && (
                        <ul key={i} className="list-disc list-inside text-slate-300 space-y-1 pl-2">
                          {(block.items || []).map((item: string, j: number) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      )) ||
                      null
                    ))
                  ) : (
                    <SimpleFormattedContent
                      content={chapter?.content ?? ""}
                      className="space-y-4"
                      paragraphClassName="text-slate-300 leading-relaxed text-sm"
                      headingClassName="text-base font-semibold text-white mt-4 mb-2 first:mt-0"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 p-2 bg-slate-800 rounded-t-lg border border-slate-700 border-b-0">
                    <button
                      type="button"
                      onClick={() => toolbar.bold()}
                      className="p-2 rounded hover:bg-slate-700 text-slate-300"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toolbar.italic()}
                      className="p-2 rounded hover:bg-slate-700 text-slate-300"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toolbar.heading()}
                      className="p-2 rounded hover:bg-slate-700 text-slate-300"
                      title="Heading"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toolbar.bullet()}
                      className="p-2 rounded hover:bg-slate-700 text-slate-300"
                      title="Bullet list"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toolbar.numbered()}
                      className="p-2 rounded hover:bg-slate-700 text-slate-300"
                      title="Numbered list"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    ref={contentTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={18}
                    className="w-full rounded-b-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[320px]"
                    placeholder="Chapter content. Use toolbar for **bold**, *italic*, ## heading, - bullets, 1. numbered list."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "quiz" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{questions.length} question(s)</span>
              <Button onClick={() => setAddQuestionOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add question
              </Button>
            </div>
            {questions.length === 0 && !addQuestionOpen ? (
              <div className="text-slate-500 text-center py-12">No questions for this chapter. Add one above.</div>
            ) : (
              <div className="space-y-4">
                {questions.map((q: any, idx: number) => (
                  <Card key={q.id} className="border border-slate-700 bg-slate-900">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-white mb-4 flex-1">
                          <span className="text-indigo-400 mr-2">{idx + 1}.</span>
                          {q.question}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                          disabled={deletingQuestionId === q.id}
                          className="text-red-400 hover:bg-red-950/50 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(q.options || {}).map(([key, value]) => (
                          <div
                            key={key}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                              key === q.correct_answer
                                ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
                                : "bg-slate-800/50 text-slate-400"
                            }`}
                          >
                            <span className="font-mono font-bold w-5">{key}.</span>
                            <span>{value as string}</span>
                            {key === q.correct_answer && (
                              <span className="ml-auto text-xs text-emerald-400 font-medium">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-slate-500 font-medium">Explanation: </span>
                          <span className="text-xs text-slate-400">{q.explanation}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {addQuestionOpen && (
              <Card className="border border-indigo-800 bg-slate-900">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-white font-medium">New question</div>
                  <Input
                    value={newQ.question}
                    onChange={(e) => setNewQ((p) => ({ ...p, question: e.target.value }))}
                    placeholder="Question text"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {(["A", "B", "C", "D"] as const).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-6">{key}.</span>
                      <Input
                        value={newQ[key]}
                        onChange={(e) => setNewQ((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={`Option ${key}`}
                        className="bg-slate-800 border-slate-700 text-white flex-1"
                      />
                      <label className="flex items-center gap-1 text-sm text-slate-400 shrink-0">
                        <input
                          type="radio"
                          name="correct"
                          checked={newQ.correct_answer === key}
                          onChange={() => setNewQ((p) => ({ ...p, correct_answer: key }))}
                          className="rounded"
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                  <Input
                    value={newQ.explanation}
                    onChange={(e) => setNewQ((p) => ({ ...p, explanation: e.target.value }))}
                    placeholder="Explanation (optional)"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddQuestion} disabled={addingQuestion} className="bg-indigo-600 hover:bg-indigo-500">
                      {addingQuestion ? "Adding…" : "Add question"}
                    </Button>
                    <Button variant="outline" onClick={() => { setAddQuestionOpen(false); setNewQ({ question: "", A: "", B: "", C: "", D: "", correct_answer: "A", explanation: "" }) }} className="border-slate-600 text-slate-300">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
