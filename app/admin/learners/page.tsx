"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function LearnersPage() {
  const router = useRouter()
  const [learners, setLearners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviting, setInviting] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { fetchLearners() }, [])

  const fetchLearners = async () => {
    try {
      const res = await api.get("/workspaces/me/members")
      setLearners(res.data)
    } catch { router.push("/login") }
    finally { setLoading(false) }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return toast.error("Email is required")
    if (!inviteName) return toast.error("Name is required")
    setInviting(true)
    try {
      await api.post("/workspaces/me/invite", { email: inviteEmail, full_name: inviteName })
      toast.success("Learner invited! Welcome email sent.")
      setInviteEmail("")
      setInviteName("")
      setOpen(false)
      fetchLearners()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invite failed")
    } finally {
      setInviting(false)
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

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Learners</h1>
            <p className="text-slate-400 mt-1">Invite learners by email; they receive a welcome email.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">+ Invite Learner</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Invite a Learner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input placeholder="Full name" value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                <Input placeholder="Email address" type="email" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                <Button onClick={handleInvite} disabled={inviting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                  {inviting ? "Inviting..." : "Send Invite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-slate-400 text-center py-8">Loading...</div>
            ) : learners.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No learners yet. Invite by email to get started.</div>
            ) : (
              <div className="space-y-3">
                {learners.map((learner) => (
                  <div key={learner.id}
                    onClick={() => router.push(`/admin/learners/${learner.id}`)}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                        {learner.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-medium text-white">{learner.full_name}</div>
                        <div className="text-slate-400 text-sm">{learner.email}</div>
                      </div>
                    </div>
                    <span className="text-slate-500 text-sm">View profile, progress & quiz scores →</span>
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
