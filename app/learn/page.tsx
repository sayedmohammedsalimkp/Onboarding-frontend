"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LearnPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents/")
      setDocuments(res.data.filter((d: any) => d.status === "completed"))
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold">Train<span className="text-indigo-400">IQ</span></div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/assistant")} className="text-slate-400 hover:text-white">
            AI Assistant
          </Button>
          <Button variant="ghost" onClick={() => { localStorage.clear(); router.push("/login") }}
            className="text-slate-400 hover:text-white text-sm">
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Training</h1>
          <p className="text-slate-400 mt-1">Select a document to start learning</p>
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-12">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-slate-500 text-center py-12">
            No training documents available yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <Card key={doc.id}
                onClick={() => router.push(`/learn/${doc.id}`)}
                className="bg-slate-900 border-slate-800 cursor-pointer hover:border-indigo-600 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-400 text-sm">{doc.chapter_count} chapters</div>
                  <Button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                    Start Learning →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
