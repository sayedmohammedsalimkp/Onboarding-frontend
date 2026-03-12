"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function OnboardPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    setRole(localStorage.getItem("role"))
    if (localStorage.getItem("role") === "admin") {
      api.get("/workspaces/me").then((res) => {
        if (res.data?.name) setCompanyName(res.data.name)
      }).catch(() => {})
    }
  }, [])

  const handleComplete = async () => {
    if (!fullName.trim()) return toast.error("Please enter your full name")
    if (role === "admin" && !companyName.trim()) return toast.error("Please enter company name")
    setLoading(true)
    try {
      await api.post("/auth/complete-profile", {
        full_name: fullName.trim(),
        ...(role === "admin" && {
          company_name: companyName.trim() || undefined,
          business_type: businessType.trim() || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      })
      toast.success("Welcome to TrainIQ!")
      if (role === "super_admin") router.push("/superadmin")
      else if (role === "admin") router.push("/admin/plan")
      else router.push("/learn")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-white tracking-tight">
            Train<span className="text-indigo-400">IQ</span>
          </div>
          <p className="text-slate-400 text-sm">One last step</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Complete your profile</CardTitle>
            <CardDescription className="text-slate-400">
              {role === "admin" ? "Add your details and company information" : "Tell us your name to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your full name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            {role === "admin" && (
              <>
                <Input
                  placeholder="Company name *"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Input
                  placeholder="Business type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Input
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Input
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </>
            )}
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {loading ? "Saving..." : "Get Started →"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
