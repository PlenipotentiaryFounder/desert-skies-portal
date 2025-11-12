"use client"

import { EnhancedSyllabus } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Copy, 
  Archive, 
  Trash2, 
  AlertTriangle,
  Download,
  Upload
} from "lucide-react"

interface SyllabusSettingsTabProps {
  syllabus: EnhancedSyllabus
}

export function SyllabusSettingsTab({ syllabus }: SyllabusSettingsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Status & Visibility Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status & Visibility
          </CardTitle>
          <CardDescription>
            Control syllabus availability and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active-status">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Make syllabus available for enrollment
              </p>
            </div>
            <Switch 
              id="active-status" 
              checked={syllabus.is_active}
              disabled
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Current Version</p>
            <Badge variant="outline">{syllabus.version || '1.0'}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage syllabus lifecycle and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate Syllabus
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export Syllabus Data
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Import Lessons
          </Button>
          
          <Separator />
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-orange-600 hover:text-orange-700"
            disabled
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive Syllabus
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-destructive/50 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions - proceed with caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Deleting a syllabus will permanently remove all associated lessons, 
              maneuvers, and student progress data. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              className="w-full md:w-auto"
              disabled
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Syllabus
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            Syllabus creation and modification history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{new Date(syllabus.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Last Updated</p>
              <p className="font-medium">{new Date(syllabus.updated_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Syllabus ID</p>
              <p className="font-mono text-xs">{syllabus.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Total Hours</p>
              <p className="font-medium">{syllabus.total_hours} hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

