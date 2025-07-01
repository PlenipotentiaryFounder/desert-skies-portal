import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

const cookieStore = await cookies()
const supabase = createClient(cookieStore) 