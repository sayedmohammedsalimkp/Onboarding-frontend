"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DocumentChaptersPage() {
  const router = useRouter()
  const { documentId } = useParams()
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDocument() }, [])

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/documents/${documentId}`)
      setDocument(res.data)
    } catch { router.push("/learn") }
    finally { setLoading(false) }
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
        <Button variant="ghost" onClick={() => router.push("/learn")} className="text-slate-400 hover:text-white">
          ← My Training
        </Button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{document?.title}</h1>
          <p className="text-slate-400 mt-1">{document?.chapters?.length} chapters</p>
        </div>

        <div className="space-y-3">
          {document?.chapters?.map((chapter: any, idx: number) => (
            <div key={chapter.id}
              onClick={() => router.push(`/learn/${documentId}/${chapter.id}`)}
              className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-indigo-600 transition-colors">
              <div className="text-2xl font-bold text-indigo-400/40 font-mono w-8">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">{chapter.title}</div>
                <div className="text-slate-400 text-sm mt-0.5 line-clamp-1">{chapter.summary}</div>
                {chapter.key_terms?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chapter.key_terms.slice(0, 3).map((term: string) => (
                      <span key={term} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-slate-600 text-xl">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
