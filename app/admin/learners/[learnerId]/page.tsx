"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LearnerProfilePage() {
  const router = useRouter()
  const { learnerId } = useParams()
  const [learner, setLearner] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [learnerId])

  const fetchData = async () => {
    if (!learnerId) return
    try {
      const [membersRes, overviewRes] = await Promise.all([
        api.get("/workspaces/me/members"),
        api.get(`/admin/learner-overview/${learnerId}`)
      ])
      const found = membersRes.data.find((m: any) => m.id === learnerId)
      setLearner(found || overviewRes.data.learner)

      const docsRes = await api.get("/documents/")
      const completedDocs = docsRes.data.filter((d: any) => d.status === "completed")
      const chapterMap: Record<string, { chapter_title: string, doc_title: string }> = {}
      for (const doc of completedDocs) {
        const docRes = await api.get(`/documents/${doc.id}`)
        for (const chapter of docRes.data.chapters || []) {
          chapterMap[chapter.id] = { chapter_title: chapter.title, doc_title: doc.title }
        }
      }

      const enrichedProgress = (overviewRes.data.progress || []).map((p: any) => ({
        ...p,
        chapter_title: chapterMap[p.chapter_id]?.chapter_title || "Unknown Chapter",
        doc_title: chapterMap[p.chapter_id]?.doc_title || ""
      }))

      const enrichedAttempts = (overviewRes.data.attempts || []).map((a: any) => ({
        ...a,
        chapter_title: chapterMap[a.chapter_id]?.chapter_title || "Unknown Chapter"
      }))

      setProgress(enrichedProgress)
      setAttempts(enrichedAttempts)
    } catch (err) {
      console.error(err)
      router.push("/admin/learners")
    } finally {
      setLoading(false)
    }
  }

  const statusColor: any = {
    mastered: "text-emerald-400",
    completed: "text-blue-400",
    in_progress: "text-yellow-400",
    not_started: "text-slate-500"
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
        <Button variant="ghost" onClick={() => router.push("/admin/learners")} className="text-slate-400 hover:text-white">
          ← Learners
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold">
                {learner?.full_name?.charAt(0) || "?"}
              </div>
              <div>
                <div className="text-xl font-bold text-white">{learner?.full_name}</div>
                <div className="text-slate-400 text-sm">{learner?.email}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Joined {learner?.created_at ? new Date(learner.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {progress.filter(p => p.status === "mastered").length}
              </div>
              <div className="text-slate-400 text-sm mt-1">Chapters Mastered</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">{attempts.length}</div>
              <div className="text-slate-400 text-sm mt-1">Quiz Attempts</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">
                {attempts.length > 0
                  ? `${Math.round(attempts.reduce((sum: number, a: any) => sum + a.score, 0) / attempts.length)}%`
                  : "N/A"}
              </div>
              <div className="text-slate-400 text-sm mt-1">Avg Score</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Chapter Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No progress yet</div>
            ) : (
              <div className="space-y-3">
                {progress.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div>
                      <div className="text-white text-sm font-medium">{p.chapter_title}</div>
                      <div className="text-slate-500 text-xs">{p.doc_title}</div>
                    </div>
                    <span className={`text-xs font-medium capitalize ${statusColor[p.status] || "text-slate-500"}`}>
                      {p.status?.replace("_", " ") || "Not started"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No quiz attempts yet</div>
            ) : (
              <div className="space-y-3">
                {attempts.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div>
                      <div className="text-white text-sm font-medium">{a.chapter_title}</div>
                      <div className="text-xs mt-0.5 text-slate-500">Quiz</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${a.passed ? "text-emerald-400" : "text-red-400"}`}>
                        {a.score}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.correct_answers}/{a.total_questions} correct
                      </div>
                    </div>
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
