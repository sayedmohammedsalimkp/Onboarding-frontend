"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PLANS = [
  { id: "free", name: "Free", docs: "1 document", users: "5 users", code: null },
  { id: "pro", name: "Pro", docs: "5 documents", users: "15 users", code: "PRO123" },
  { id: "max", name: "Max", docs: "Unlimited documents", users: "Unlimited users", code: "MAX123" },
]

export default function AdminPlanPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRedeem = async () => {
    const c = code.trim().toUpperCase()
    if (!c) return toast.error("Enter a redeem code")
    setLoading(true)
    try {
      await api.post("/workspaces/me/redeem", { code: c })
      toast.success("Plan upgraded!")
      router.push("/admin/dashboard")
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  const handleSkipToFree = () => {
    router.push("/admin/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-white tracking-tight">
            Train<span className="text-indigo-400">IQ</span>
          </div>
          <p className="text-slate-400">Choose your plan</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Plans</CardTitle>
            <CardDescription className="text-slate-400">
              Redeem a code or continue with Free (1 document, 5 users).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700"
                >
                  <div>
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-slate-400 text-sm ml-2">— {p.docs}, {p.users}</span>
                  </div>
                  {p.code && (
                    <span className="text-xs text-indigo-400 font-mono">{p.code}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Redeem code (e.g. PRO123)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleRedeem}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
              >
                {loading ? "..." : "Redeem"}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleSkipToFree}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Skip to Free
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
