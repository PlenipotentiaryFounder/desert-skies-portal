import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SignupUI } from "./signup-ui"

export default async function SignupPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/")
  }

  return <SignupUI />
}