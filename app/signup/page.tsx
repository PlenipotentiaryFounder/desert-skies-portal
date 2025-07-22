import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SignupUI } from "./signup-ui"

export default async function SignupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return <SignupUI />
}