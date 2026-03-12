"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function QuizPage() {
  const router = useRouter()
  const { chapterId } = useParams()
  const searchParams = useSearchParams()
  const documentId = searchParams.get("documentId")

  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (chapterId && chapterId !== "undefined") {
      fetchQuestions()
    }
  }, [chapterId])

  const fetchQuestions = async () => {
    setLoading(true)
    setAnswers({})
    setResult(null)
    try {
      const res = await api.get(`/quiz/${chapterId}/questions`)
      setQuestions(res.data.questions || [])
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return toast.error("Please answer all questions")
    }
    setSubmitting(true)
    try {
      const res = await api.post("/quiz/submit", {
        chapter_id: chapterId,
        answers: Object.entries(answers).map(([question_id, selected_answer]) => ({
          question_id, selected_answer
        }))
      })
      setResult(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/learn")}>
          Train<span className="text-indigo-400">IQ</span>
        </div>
        <Button variant="ghost" onClick={() => router.push(`/learn/${documentId}`)} className="text-slate-400 hover:text-white">
          ← Chapters
        </Button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quiz</h1>
          <p className="text-slate-400 mt-1">Score 70% or more to pass and master this chapter.</p>
        </div>

        {/* Result */}
        {result && (
          <Card className={`border ${result.passed ? "bg-emerald-950/50 border-emerald-800" : "bg-red-950/50 border-red-800"}`}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold">
                  {result.score}%
                </div>
                <div className={`text-lg font-medium ${result.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {result.passed ? "🎉 Passed! (70%+)" : "❌ Not quite — need 70% to pass. Try again"}
                </div>
                <div className="text-slate-400 text-sm">
                  {result.correct} / {result.total} correct
                </div>
              </div>

              {/* Chapter mastered */}
              {result.passed && (
                <div className="mt-6 p-4 rounded-lg bg-emerald-900/30 border border-emerald-700 text-center">
                  <div className="text-xl font-bold text-emerald-400">Chapter mastered</div>
                  <p className="text-slate-400 text-sm mt-1">Great work!</p>
                  <Button
                    onClick={() => router.push(`/learn/${documentId}`)}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white">
                    Back to chapters
                  </Button>
                </div>
              )}

              {/* Answer breakdown */}
              <div className="mt-6 space-y-3">
                {result.results.map((r: any) => (
                  <div key={r.question_id} className={`p-3 rounded-lg ${r.is_correct ? "bg-emerald-900/30" : "bg-red-900/30"}`}>
                    <div className="text-sm text-slate-300">{r.question}</div>
                    <div className="text-xs mt-1 text-slate-400">
                      Your answer: <span className={r.is_correct ? "text-emerald-400" : "text-red-400"}>{r.selected}</span>
                      {!r.is_correct && <span className="ml-2">Correct: <span className="text-emerald-400">{r.correct_answer}</span></span>}
                    </div>
                    <div className="text-xs mt-1 text-slate-500">{r.explanation}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={fetchQuestions} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:text-white">
                  Try Again
                </Button>
                {result.passed && (
                  <Button
                    onClick={() => router.push(`/learn/${documentId}`)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
                    Back to chapters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {!result && (
          <>
            {loading ? (
              <div className="text-slate-400 text-center py-12">Loading questions...</div>
            ) : (
              <div className="space-y-5">
                {questions.map((q, idx) => (
                  <Card key={q.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="pt-6">
                      <div className="font-medium text-white mb-4">
                        <span className="text-indigo-400 mr-2">{idx + 1}.</span>
                        {q.question}
                      </div>
                      <div className="space-y-2">
                        {Object.entries(q.options).map(([key, value]) => (
                          <button key={key}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: key }))}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                              answers[q.id] === key
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}>
                            <span className="font-mono font-bold mr-2">{key}.</span>
                            {value as string}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {questions.length > 0 && (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length < questions.length}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                    {submitting ? "Submitting..." : `Submit ${questions.length} Answers`}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
