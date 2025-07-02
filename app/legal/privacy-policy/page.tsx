import fs from "fs"
import path from "path"
import { Card, CardContent } from "@/components/ui/card"
import { marked } from "marked"

export default async function PrivacyPolicyPage() {
  const filePath = path.join(process.cwd(), "app/legal/privacy-policy.md")
  const markdown = fs.readFileSync(filePath, "utf-8")
  const html = marked.parse(markdown)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardContent className="prose prose-lg max-w-none p-8">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </CardContent>
      </Card>
    </div>
  )
} 