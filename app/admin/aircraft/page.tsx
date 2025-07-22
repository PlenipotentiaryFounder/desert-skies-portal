"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plane, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Settings,
  BarChart3,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  DollarSign,
  MapPin,
  Gauge,
  Fuel,
  Compass,
  Target,
  Award,
  Star
} from 'lucide-react'
import { AircraftFleetDashboard } from '@/components/admin/aircraft-fleet-dashboard'
import { AircraftList } from '@/components/admin/aircraft-list'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default function AircraftManagementPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const router = useRouter()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 rounded-xl">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-aviation-sky-900 font-display">
              Aircraft Fleet Management
            </h1>
            <p className="text-aviation-sky-600">
              Comprehensive fleet oversight, maintenance tracking, and operational management
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            className="bg-gradient-to-r from-aviation-sky-600 to-aviation-sky-700 text-white"
            onClick={() => router.push('/admin/aircraft/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Aircraft
          </Button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card className="bg-gradient-to-br from-aviation-sky-50 to-aviation-sky-100 border-aviation-sky-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="ghost" className="h-auto p-4 flex flex-col items-center gap-2 bg-white/50 hover:bg-white/70">
                <Wrench className="w-6 h-6 text-aviation-sky-600" />
                <span className="text-sm font-medium">Schedule Maintenance</span>
              </Button>
              <Button variant="ghost" className="h-auto p-4 flex flex-col items-center gap-2 bg-white/50 hover:bg-white/70">
                <AlertTriangle className="w-6 h-6 text-aviation-sky-600" />
                <span className="text-sm font-medium">Report Squawk</span>
              </Button>
              <Button variant="ghost" className="h-auto p-4 flex flex-col items-center gap-2 bg-white/50 hover:bg-white/70">
                <FileText className="w-6 h-6 text-aviation-sky-600" />
                <span className="text-sm font-medium">Upload Documents</span>
              </Button>
              <Button variant="ghost" className="h-auto p-4 flex flex-col items-center gap-2 bg-white/50 hover:bg-white/70">
                <BarChart3 className="w-6 h-6 text-aviation-sky-600" />
                <span className="text-sm font-medium">View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Fleet Dashboard
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Aircraft List
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <AircraftFleetDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="aircraft" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Aircraft Inventory
                </CardTitle>
                <CardDescription>
                  Manage your aircraft fleet, view details, and track status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AircraftList />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Maintenance Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Maintenance Schedule
                  </CardTitle>
                  <CardDescription>
                    Upcoming maintenance events and inspections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Cessna 172 Annual Inspection</div>
                          <div className="text-sm text-muted-foreground">Due in 5 days</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Schedule</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wrench className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Piper Arrow 100-Hour</div>
                          <div className="text-sm text-muted-foreground">Due in 12 days</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Schedule</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Diamond DA40 Oil Change</div>
                          <div className="text-sm text-muted-foreground">Completed today</div>
                        </div>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Squawk Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Recent Squawks
                  </CardTitle>
                  <CardDescription>
                    Latest maintenance requests and issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">Engine Rough Running</div>
                          <div className="text-sm text-muted-foreground">Cessna 152 - Critical</div>
                        </div>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Landing Light Inop</div>
                          <div className="text-sm text-muted-foreground">Piper Warrior - Normal</div>
                        </div>
                      </div>
                      <Badge variant="secondary">Normal</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Fuel Gauge Sticky</div>
                          <div className="text-sm text-muted-foreground">Cessna 172 - Resolved</div>
                        </div>
                      </div>
                      <Badge variant="outline">Resolved</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Aircraft Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Aircraft Documents
                  </CardTitle>
                  <CardDescription>
                    Airworthiness certificates, registrations, and manuals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Airworthiness Certificate</div>
                          <div className="text-sm text-muted-foreground">Cessna 172 - Expires 2026</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Registration Certificate</div>
                          <div className="text-sm text-muted-foreground">Piper Arrow - Current</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Operating Limitations</div>
                          <div className="text-sm text-muted-foreground">Diamond DA40 - Expires 2025</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Documents
                  </CardTitle>
                  <CardDescription>
                    Add new aircraft documents and certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop files here, or click to browse
                      </p>
                      <Button variant="outline" size="sm">
                        Choose Files
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Supported Document Types:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Airworthiness Certificates (PDF)</li>
                        <li>• Registration Certificates (PDF)</li>
                        <li>• Operating Limitations (PDF)</li>
                        <li>• Weight & Balance Data (PDF/Excel)</li>
                        <li>• Maintenance Manuals (PDF)</li>
                        <li>• Inspection Reports (PDF)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
