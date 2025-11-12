'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, CheckCircle, AlertCircle, Plane } from 'lucide-react'
import { toast } from 'sonner'

interface ImportStats {
  totalRows: number
  validRows: number
  duplicates: number
  errors: number
}

interface ForeFlightImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function ForeFlightImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ForeFlightImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<ImportStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [importProgress, setImportProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setPreviewData(null)
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const content = await file.text()
      setCsvContent(content)

      const response = await fetch('/api/instructor/logbook/import-foreflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: content,
          preview: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to preview import')
      }

      if (!result.success) {
        throw new Error(result.error || 'Preview failed')
      }

      setPreviewData({
        totalRows: result.totalRows,
        validRows: result.validRows,
        duplicates: result.duplicates,
        errors: result.errors?.length || 0,
      })

      if (result.errors?.length > 0) {
        console.warn('Preview errors:', result.errors)
      }

      toast.success('Preview generated successfully!')
    } catch (err) {
      console.error('Preview error:', err)
      setError(err instanceof Error ? err.message : 'Failed to preview file')
      toast.error('Failed to preview file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    if (!csvContent || !previewData) return

    setIsImporting(true)
    setError(null)
    setImportProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/instructor/logbook/import-foreflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          preview: false,
          skipDuplicates: true,
        }),
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import')
      }

      if (!result.success) {
        throw new Error(result.error || 'Import failed')
      }

      toast.success(`Successfully imported ${result.created} flights!`)
      
      // Reset state
      setFile(null)
      setPreviewData(null)
      setCsvContent('')
      setImportProgress(0)
      
      // Close dialog and refresh
      onImportComplete()
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Failed to import flights')
      toast.error('Import failed')
      setImportProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (!isUploading && !isImporting) {
      setFile(null)
      setPreviewData(null)
      setError(null)
      setCsvContent('')
      setImportProgress(0)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Import ForeFlight Logbook
          </DialogTitle>
          <DialogDescription>
            Upload your ForeFlight CSV export to import your flight history into Desert Skies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">ForeFlight CSV Export</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading || isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Export from ForeFlight: Menu → Logbook → Export → CSV
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Stats */}
          {previewData && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Preview Results
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Flights</p>
                  <p className="text-2xl font-bold">{previewData.totalRows}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Valid Entries</p>
                  <p className="text-2xl font-bold text-green-600">{previewData.validRows}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-600">{previewData.duplicates}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.errors}</p>
                </div>
              </div>
              {previewData.validRows > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Ready to import {previewData.validRows} flight{previewData.validRows !== 1 ? 's' : ''}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Importing flights...</span>
                <span className="font-medium">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading || isImporting}
          >
            Cancel
          </Button>
          
          {!previewData ? (
            <Button
              onClick={handlePreview}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Preview Import
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={previewData.validRows === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Import {previewData.validRows} Flights
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

