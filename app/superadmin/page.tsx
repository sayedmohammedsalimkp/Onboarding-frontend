"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Building2, Users, FileText, BookOpen, PlusCircle, Trash2, ChevronRight } from "lucide-react"

export default function SuperAdminPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addOrgOpen, setAddOrgOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({ name: "", description: "", business_type: "", address: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchOrgs = async () => {
    try {
      const res = await api.get("/superadmin/orgs")
      setOrgs(Array.isArray(res.data) ? res.data : [])
    } catch (e: any) {
      if (e.response?.status === 403) {
        router.push("/login")
        return
      }
      toast.error("Failed to load orgs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [])

  const handleAddOrg = async () => {
    if (!newOrg.name.trim()) return toast.error("Org name is required")
    setSubmitting(true)
    try {
      await api.post("/superadmin/orgs", {
        name: newOrg.name.trim(),
        description: newOrg.description.trim() || undefined,
        business_type: newOrg.business_type.trim() || undefined,
        address: newOrg.address.trim() || undefined,
        phone: newOrg.phone.trim() || undefined,
      })
      toast.success("Org created")
      setAddOrgOpen(false)
      setNewOrg({ name: "", description: "", business_type: "", address: "", phone: "" })
      fetchOrgs()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to create org")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOrg = async (id: string, name: string) => {
    if (!confirm(`Delete org "${name}"? All users, documents and chapters will be removed.`)) return
    try {
      await api.delete(`/superadmin/orgs/${id}`)
      toast.success("Org deleted")
      fetchOrgs()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold">
          Train<span className="text-indigo-400">IQ</span> <span className="text-slate-500 text-sm font-normal">Super Admin</span>
        </div>
        <Button variant="ghost" onClick={() => { localStorage.clear(); router.push("/login") }} className="text-slate-400 hover:text-white">
          Log out
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Organizations</h1>
          <Button onClick={() => setAddOrgOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add org
          </Button>
        </div>

        {orgs.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center text-slate-500">
              No organizations yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => (
              <Card
                key={org.id}
                className="bg-slate-900 border-slate-800 hover:border-indigo-700 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
                      onClick={() => router.push(`/superadmin/orgs/${org.id}`)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-950 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{org.name}</div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {org.user_count} users</span>
                          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {org.document_count} docs</span>
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {org.chapter_count} chapters</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id, org.name) }}
                      className="text-red-400 hover:bg-red-950/50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOrgOpen} onOpenChange={setAddOrgOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Org name *"
              value={newOrg.name}
              onChange={(e) => setNewOrg((p) => ({ ...p, name: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Description"
              value={newOrg.description}
              onChange={(e) => setNewOrg((p) => ({ ...p, description: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Business type"
              value={newOrg.business_type}
              onChange={(e) => setNewOrg((p) => ({ ...p, business_type: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Address"
              value={newOrg.address}
              onChange={(e) => setNewOrg((p) => ({ ...p, address: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Phone"
              value={newOrg.phone}
              onChange={(e) => setNewOrg((p) => ({ ...p, phone: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOrgOpen(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={handleAddOrg} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500">Add org</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
