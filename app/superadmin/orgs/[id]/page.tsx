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
import { Building2, Users, FileText, BookOpen, PlusCircle, Trash2, ArrowLeft } from "lucide-react"

export default function SuperAdminOrgPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: "", full_name: "", role: "learner" })
  const [submitting, setSubmitting] = useState(false)

  const fetchOrg = async () => {
    try {
      const res = await api.get(`/superadmin/orgs/${id}`)
      setOrg(res.data)
    } catch (e: any) {
      if (e.response?.status === 403) router.push("/login")
      else if (e.response?.status === 404) router.push("/superadmin")
      else toast.error("Failed to load org")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchOrg()
  }, [id])

  const handleAddUser = async () => {
    if (!newUser.email.trim() || !newUser.full_name.trim()) return toast.error("Email and full name required")
    setSubmitting(true)
    try {
      await api.post(`/superadmin/orgs/${id}/users`, {
        email: newUser.email.trim(),
        full_name: newUser.full_name.trim(),
        role: newUser.role,
      })
      toast.success("User added")
      setAddUserOpen(false)
      setNewUser({ email: "", full_name: "", role: "learner" })
      fetchOrg()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add user")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!org || !confirm(`Delete "${org.name}"? All users, documents and chapters will be removed.`)) return
    try {
      await api.delete(`/superadmin/orgs/${id}`)
      toast.success("Org deleted")
      router.push("/superadmin")
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete")
    }
  }

  if (loading || !org) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/superadmin")} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button variant="ghost" onClick={() => { localStorage.clear(); router.push("/login") }} className="text-slate-400 hover:text-white">
          Log out
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-950 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              {org.description && <p className="text-slate-500 mt-0.5">{org.description}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                {org.business_type && <span>Type: {org.business_type}</span>}
                {org.address && <span>Address: {org.address}</span>}
                {org.phone && <span>Phone: {org.phone}</span>}
              </div>
            </div>
          </div>
          <Button onClick={handleDeleteOrg} variant="outline" className="border-red-800 text-red-400 hover:bg-red-950/50">
            <Trash2 className="w-4 h-4 mr-2" /> Delete org
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" /> Users ({org.users?.length ?? 0})
            </CardTitle>
            <Button size="sm" onClick={() => setAddUserOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <PlusCircle className="w-4 h-4 mr-2" /> Add user
            </Button>
          </CardHeader>
          <CardContent>
            {!org.users?.length ? (
              <p className="text-slate-500 text-sm">No users. Add one to invite learners or admins.</p>
            ) : (
              <ul className="space-y-2">
                {org.users.map((u: any) => (
                  <li key={u.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <span className="font-medium">{u.full_name || u.email}</span>
                      <span className="text-slate-500 text-sm ml-2">({u.email})</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${u.role === "admin" ? "bg-indigo-900/50 text-indigo-300" : "bg-slate-700 text-slate-300"}`}>
                      {u.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" /> Documents ({org.documents?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!org.documents?.length ? (
              <p className="text-slate-500 text-sm">No documents yet.</p>
            ) : (
              <ul className="space-y-2">
                {org.documents.map((d: any) => (
                  <li key={d.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <span>{d.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${d.status === "completed" ? "bg-emerald-900/50 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Chapters ({org.chapter_count ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">Total chapters across all documents in this org.</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add user to org</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="email"
              placeholder="Email *"
              value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Full name *"
              value={newUser.full_name}
              onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <div>
              <label className="text-sm text-slate-400 block mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2"
              >
                <option value="learner">Learner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={handleAddUser} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500">Add user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
