"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSetupThomas = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/setup-thomas", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up Thomas's roles")
      }

      toast({
        title: "Success",
        description: "Thomas's roles have been set up successfully.",
      })
    } catch (error) {
      console.error("Error setting up Thomas's roles:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set up Thomas's roles",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>Configure special admin settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Click the button below to ensure Thomas has both admin and instructor roles.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetupThomas} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Setup Thomas's Roles"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
