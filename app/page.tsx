"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")
    if (!token) { router.push("/login"); return }
    if (role === "admin") router.push("/admin/dashboard")
    else router.push("/learn")
  }, [])
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  )
}
