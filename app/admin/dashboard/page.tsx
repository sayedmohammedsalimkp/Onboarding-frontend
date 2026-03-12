"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem("role")
    if (!role || role !== "admin") { router.push("/login"); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        api.get("/workspaces/me/stats"),
        api.get("/documents/")
      ])
      setStats(statsRes.data)
      setDocuments(docsRes.data)
    } catch { router.push("/login") }
    finally { setLoading(false) }
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
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold">Train<span className="text-indigo-400">IQ</span></div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/admin/documents")} className="text-slate-400 hover:text-white">
            Documents
          </Button>
          <Button variant="ghost" onClick={() => router.push("/admin/learners")} className="text-slate-400 hover:text-white">
            Learners
          </Button>
          <Button variant="ghost" onClick={() => router.push("/admin/account")} className="text-slate-400 hover:text-white">
            Account
          </Button>
          <Button onClick={() => { localStorage.clear(); router.push("/login") }}
            variant="ghost" className="text-slate-400 hover:text-white text-sm">
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your training workspace</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Learners", value: stats.total_learners },
              { label: "Documents", value: stats.total_documents },
              { label: "Chapters", value: stats.total_chapters },
              { label: "Pass Rate", value: stats.pass_rate },
            ].map((s) => (
              <Card key={s.label} className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-slate-400 text-sm mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Documents */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Documents</CardTitle>
            <Button onClick={() => router.push("/admin/documents")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
              + Upload New
            </Button>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No documents yet. Upload your first training document.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id}
                    onClick={() => router.push(`/admin/documents/${doc.id}`)}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <div>
                      <div className="font-medium text-white">{doc.title}</div>
                      <div className="text-slate-400 text-sm mt-0.5">
                        {doc.chapter_count} chapters • {doc.filename}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor[doc.status] || statusColor.pending}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
