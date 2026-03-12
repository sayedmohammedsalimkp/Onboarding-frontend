"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isNewAdmin, setIsNewAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRequestOTP = async () => {
    if (!email) return toast.error("Please enter your email")
    if (isNewAdmin && !companyName) return toast.error("Please enter your company name")
    setLoading(true)
    try {
      await api.post("/auth/request-otp", {
        email,
        ...(isNewAdmin && { company_name: companyName })
      })
      localStorage.setItem("otp_email", email)
      toast.success("OTP sent to your email!")
      router.push("/verify")
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
          <p className="text-slate-400 text-sm">AI-powered training platform</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Welcome back</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email to receive a login code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newAdmin"
                checked={isNewAdmin}
                onChange={(e) => setIsNewAdmin(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="newAdmin" className="text-slate-400 text-sm cursor-pointer">
                I'm registering a new company
              </label>
            </div>

            {isNewAdmin && (
              <Input
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            )}

            <Button
              onClick={handleRequestOTP}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
