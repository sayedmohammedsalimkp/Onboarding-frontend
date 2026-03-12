"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function VerifyPage() {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  const email = typeof window !== "undefined" ? localStorage.getItem("otp_email") || "" : ""

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) return toast.error("Please enter the 6-digit OTP")
    setLoading(true)
    try {
      const res = await api.post("/auth/verify-otp", { email, otp })
      const { access_token, role, is_onboarded } = res.data
      localStorage.setItem("token", access_token)
      localStorage.setItem("role", role)

      toast.success("Logged in successfully!")

      if (!is_onboarded) {
        router.push("/onboard")
      } else if (role === "super_admin") {
        router.push("/superadmin")
      } else if (role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/learn")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid OTP")
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
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Check your email</CardTitle>
            <CardDescription className="text-slate-400">
              We sent a 6-digit code to <span className="text-indigo-400">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
              maxLength={6}
            />

            <Button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <button
              onClick={() => router.push("/login")}
              className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              ← Back to login
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
