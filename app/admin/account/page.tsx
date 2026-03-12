"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, ArrowLeft } from "lucide-react"

const PLAN_LABELS: Record<string, string> = {
  free: "Free (1 doc, 5 users)",
  pro: "Pro (5 docs, 15 users)",
  max: "Max (unlimited)",
}

export default function AdminAccountPage() {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<any>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [redeemLoading, setRedeemLoading] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem("role")
    if (!role || role !== "admin") {
      router.push("/login")
      return
    }
    api.get("/workspaces/me")
      .then((res) => setWorkspace(res.data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [])

  const handleRedeem = async () => {
    const c = code.trim().toUpperCase()
    if (!c) return toast.error("Enter a redeem code")
    setRedeemLoading(true)
    try {
      await api.post("/workspaces/me/redeem", { code: c })
      toast.success("Plan upgraded!")
      setCode("")
      const res = await api.get("/workspaces/me")
      setWorkspace(res.data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Invalid code")
    } finally {
      setRedeemLoading(false)
    }
  }

  if (loading || !workspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const plan = (workspace.plan || "free").toLowerCase()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/admin/dashboard")} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="text-xl font-bold">Train<span className="text-indigo-400">IQ</span></div>
        <div />
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-slate-400">Your organization details and plan</p>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-slate-500 text-sm">Company name</span>
              <p className="text-white font-medium">{workspace.name || "—"}</p>
            </div>
            {workspace.description && (
              <div>
                <span className="text-slate-500 text-sm">Description</span>
                <p className="text-white">{workspace.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspace.business_type && (
                <div>
                  <span className="text-slate-500 text-sm">Business type</span>
                  <p className="text-white">{workspace.business_type}</p>
                </div>
              )}
              {workspace.address && (
                <div>
                  <span className="text-slate-500 text-sm">Address</span>
                  <p className="text-white">{workspace.address}</p>
                </div>
              )}
              {workspace.phone && (
                <div>
                  <span className="text-slate-500 text-sm">Phone</span>
                  <p className="text-white">{workspace.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Plan</CardTitle>
            <CardDescription className="text-slate-400">
              Current plan: <span className="text-white font-medium">{PLAN_LABELS[plan] || plan}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-400 text-sm">
              Redeem code: <span className="font-mono text-indigo-400">PRO123</span> for Pro, <span className="font-mono text-indigo-400">MAX123</span> for Max.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Redeem code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button
                onClick={handleRedeem}
                disabled={redeemLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
              >
                {redeemLoading ? "..." : "Redeem"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
