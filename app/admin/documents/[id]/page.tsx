"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function DocumentDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [addChapterOpen, setAddChapterOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newOrder, setNewOrder] = useState(1)
  const [newSummary, setNewSummary] = useState("")
  const [newKeyTerms, setNewKeyTerms] = useState("")
  const [newContent, setNewContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchDocument() }, [id])

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/documents/${id}`)
      setDocument(res.data)
      if (res.data.status === "pending" || res.data.status === "processing") {
        setTimeout(fetchDocument, 5000)
      }
    } catch { router.push("/admin/dashboard") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (document?.chapters?.length) {
      const maxOrder = Math.max(...document.chapters.map((c: any) => c.order))
      setNewOrder(maxOrder + 1)
    } else {
      setNewOrder(1)
    }
  }, [document?.chapters])

  const openAddChapter = () => {
    setNewTitle("")
    setNewSummary("")
    setNewKeyTerms("")
    setNewContent("")
    if (document?.chapters?.length) {
      setNewOrder(Math.max(...document.chapters.map((c: any) => c.order)) + 1)
    } else {
      setNewOrder(1)
    }
    setAddChapterOpen(true)
  }

  const handleAddChapter = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required")
      return
    }
    if (!newContent.trim()) {
      toast.error("Content is required")
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post(`/documents/${id}/chapters`, {
        title: newTitle.trim(),
        order: newOrder,
        summary: newSummary.trim() || undefined,
        key_terms: newKeyTerms.split(",").map((s) => s.trim()).filter(Boolean),
        content: newContent.trim(),
      })
      toast.success("Chapter added")
      setAddChapterOpen(false)
      fetchDocument()
      router.push(`/admin/documents/${id}/chapters/${res.data.id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add chapter")
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor: any = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    processing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20"
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
        <Button variant="ghost" onClick={() => router.push("/admin/dashboard")} className="text-slate-400 hover:text-white">
          ← Dashboard
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{document?.title}</h1>
            <p className="text-slate-400 mt-1">{document?.filename}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full border ${statusColor[document?.status]}`}>
            {document?.status}
          </span>
        </div>

        {(document?.status === "pending" || document?.status === "processing") && (
          <Card className="bg-indigo-950/50 border-indigo-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-indigo-300">
                <div className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                <span>Worker is processing your document — generating chapters and quizzes...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {document?.status === "completed" && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-white">
                Chapters ({document?.chapters?.length}) — click to view content and quiz
              </CardTitle>
              <Button onClick={openAddChapter} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                + Add chapter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document?.chapters?.map((chapter: any) => (
                  <div key={chapter.id}
                    onClick={() => router.push(`/admin/documents/${id}/chapters/${chapter.id}`)}
                    className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 hover:border-indigo-600 border border-transparent transition-all">
                    <span className="text-indigo-400 font-mono text-sm w-8">
                      {String(chapter.order).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-white">{chapter.title}</div>
                      <div className="text-slate-400 text-sm mt-0.5">{chapter.summary}</div>
                      {chapter.key_terms?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {chapter.key_terms.map((term: string) => (
                            <span key={term} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-slate-600 text-sm">View →</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {document?.status === "failed" && (
          <Card className="bg-red-950/50 border-red-800">
            <CardContent className="pt-6 text-red-300">
              Processing failed: {document?.error_message}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={addChapterOpen} onOpenChange={setAddChapterOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add new chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Title *</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Chapter title"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Order</label>
              <Input
                type="number"
                min={1}
                value={newOrder}
                onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 1)}
                className="bg-slate-800 border-slate-700 text-white w-24"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Summary</label>
              <Input
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Brief summary"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Key terms (comma-separated)</label>
              <Input
                value={newKeyTerms}
                onChange={(e) => setNewKeyTerms(e.target.value)}
                placeholder="term1, term2, term3"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Content *</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={10}
                placeholder="Chapter content (plain text or with **bold**, *italic*, ## heading, - bullets)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddChapterOpen(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleAddChapter} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500">
              {submitting ? "Adding…" : "Add chapter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
