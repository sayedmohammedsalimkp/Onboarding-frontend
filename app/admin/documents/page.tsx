"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function UploadDocumentPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [chapterCount, setChapterCount] = useState("")
  const [questionsPerChapter, setQuestionsPerChapter] = useState("")
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file")
    if (!title.trim()) return toast.error("Please enter a title")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)
    if (chapterCount) formData.append("chapter_count", chapterCount)
    if (questionsPerChapter) formData.append("questions_per_chapter", questionsPerChapter)

    setLoading(true)
    try {
      const res = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      toast.success("Document uploaded! Processing in background...")
      router.push(`/admin/documents/${res.data.document_id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/admin/dashboard")}>
          Train<span className="text-indigo-400">IQ</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/admin/account")} className="text-slate-400 hover:text-white">
            Account
          </Button>
          <Button variant="ghost" onClick={() => router.push("/admin/dashboard")} className="text-slate-400 hover:text-white">
            ← Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload Document</h1>
          <p className="text-slate-400 mt-1">Upload a training document to generate chapters and quizzes</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Document Details</CardTitle>
            <CardDescription className="text-slate-400">
              Supported formats: PDF, DOCX, TXT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">File</label>
              <div
                onClick={() => document.getElementById("fileInput")?.click()}
                className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                {file ? (
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    <div className="text-slate-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-slate-400">Click to select a file</div>
                    <div className="text-slate-600 text-sm mt-1">PDF, DOCX, TXT up to 50MB</div>
                  </div>
                )}
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Document Title</label>
              <Input
                placeholder="e.g. Sales Handbook 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Optional Settings */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <div className="text-sm text-slate-400 font-medium">
                Optional Settings <span className="text-slate-600">(leave blank for AI defaults)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Number of Chapters</label>
                  <Input
                    type="number"
                    placeholder="AI decides"
                    min={1}
                    value={chapterCount}
                    onChange={(e) => setChapterCount(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Questions per Chapter</label>
                  <Input
                    type="number"
                    placeholder="Default: 5"
                    min={1}
                    value={questionsPerChapter}
                    onChange={(e) => setQuestionsPerChapter(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
              {loading ? "Uploading..." : "Upload & Process Document"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
