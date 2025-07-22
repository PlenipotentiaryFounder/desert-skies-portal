"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Gauge, 
  Compass, 
  BarChart3, 
  Activity, 
  Fuel, 
  Clock, 
  MapPin, 
  Plane,
  Wind,
  Thermometer,
  Eye,
  Navigation,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw
} from 'lucide-react'

// Types
interface FlightData {
  altitude: number
  speed: number
  heading: number
  fuelLevel: number
  engineHours: number
  temperature: number
  windSpeed: number
  visibility: number
  pressure: number
  location: {
    lat: number
    lng: number
  }
  status: 'normal' | 'warning' | 'danger' | 'success'
  timestamp: Date
}

interface FlightDataDisplayProps {
  data: FlightData
  className?: string
  variant?: 'default' | 'glass' | 'aviation' | 'cockpit' | 'minimal'
  showControls?: boolean
  onRefresh?: () => void
  onSettings?: () => void
}

// Gauge Component
function GaugeDisplay({ 
  value, 
  max, 
  label, 
  unit, 
  color = '#FFB347',
  size = 'md',
  showValue = true 
}: {
  value: number
  max: number
  label: string
  unit: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}) {
  const percentage = (value / max) * 100
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono font-bold text-white">
              {value}
            </span>
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-white/80">{label}</div>
        {showValue && (
          <div className="text-xs text-white/60">{unit}</div>
        )}
      </div>
    </div>
  )
}

// Compass Component
function CompassDisplay({ heading }: { heading: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <div 
          className="absolute inset-0 rounded-full border-2 border-aviation-sunset-300/30 bg-gradient-to-br from-aviation-sky-900/50 to-aviation-sky-800/50"
          style={{ transform: `rotate(${heading}deg)` }}
        >
          <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-aviation-sunset-500 transform -translate-x-1/2 -translate-y-full rounded-full shadow-lg" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-white">
            {heading}°
          </span>
        </div>
      </div>
      <div className="text-xs font-medium text-white/80">Heading</div>
    </div>
  )
}

// Main Flight Data Display Component
export function FlightDataDisplay({
  data,
  className,
  variant = 'aviation',
  showControls = true,
  onRefresh,
  onSettings
}: FlightDataDisplayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-aviation-success-500'
      case 'warning': return 'text-aviation-warning-500'
      case 'danger': return 'text-aviation-danger-500'
      default: return 'text-aviation-sunset-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'danger': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-aviation-sunset-500/20 to-aviation-sky-600/20">
              <Plane className="w-5 h-5 text-aviation-sunset-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-aviation">Flight Data</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time aircraft telemetry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(data.status)} border-current`}
            >
              <div className="flex items-center gap-1">
                {getStatusIcon(data.status)}
                {data.status.toUpperCase()}
              </div>
            </Badge>
            {showControls && (
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
                {onSettings && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSettings}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Primary Flight Instruments */}
          <div className="col-span-2 md:col-span-4 grid grid-cols-4 gap-4 mb-6">
            <GaugeDisplay
              value={data.altitude}
              max={25000}
              label="Altitude"
              unit="ft"
              color="#FFB347"
              size="lg"
            />
            <GaugeDisplay
              value={data.speed}
              max={200}
              label="Speed"
              unit="kts"
              color="#1E3A8A"
              size="lg"
            />
            <CompassDisplay heading={data.heading} />
            <GaugeDisplay
              value={data.fuelLevel}
              max={100}
              label="Fuel"
              unit="%"
              color={data.fuelLevel < 20 ? '#EF4444' : '#10B981'}
              size="lg"
            />
          </div>

          {/* Secondary Data */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-aviation-sunset-400" />
                <span className="text-sm">Temperature</span>
              </div>
              <span className="text-sm font-mono font-bold">
                {data.temperature}°C
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-aviation-sky-400" />
                <span className="text-sm">Wind</span>
              </div>
              <span className="text-sm font-mono font-bold">
                {data.windSpeed} kts
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-aviation-sunset-400" />
                <span className="text-sm">Visibility</span>
              </div>
              <span className="text-sm font-mono font-bold">
                {data.visibility} nm
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-aviation-sky-400" />
                <span className="text-sm">Pressure</span>
              </div>
              <span className="text-sm font-mono font-bold">
                {data.pressure} hPa
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-aviation-sunset-400" />
                <span className="text-sm">Engine Hours</span>
              </div>
              <span className="text-sm font-mono font-bold">
                {data.engineHours.toFixed(1)}h
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-aviation-sky-400" />
                <span className="text-sm">Location</span>
              </div>
              <span className="text-sm font-mono font-bold">
                {data.location.lat.toFixed(4)}, {data.location.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-aviation-sunset-500/10 to-aviation-sky-600/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-aviation-sunset-400" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Engine</span>
                  <Badge variant="outline" className="text-aviation-success-500 border-current text-xs">
                    Normal
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Avionics</span>
                  <Badge variant="outline" className="text-aviation-success-500 border-current text-xs">
                    Normal
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Navigation</span>
                  <Badge variant="outline" className="text-aviation-success-500 border-current text-xs">
                    Normal
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {data.timestamp.toLocaleTimeString()}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-aviation-success-500 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact Flight Data Display
export function CompactFlightDataDisplay({ data, className }: { data: FlightData, className?: string }) {
  return (
    <Card variant="glass" className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-aviation-sunset-400">
              {data.altitude}
            </div>
            <div className="text-xs text-muted-foreground">Altitude (ft)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-aviation-sky-400">
              {data.speed}
            </div>
            <div className="text-xs text-muted-foreground">Speed (kts)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-aviation-sunset-400">
              {data.heading}°
            </div>
            <div className="text-xs text-muted-foreground">Heading</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Flight Status Indicator
export function FlightStatusIndicator({ status, className }: { status: string, className?: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          color: 'text-aviation-success-500',
          bgColor: 'bg-aviation-success-500/20',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Normal'
        }
      case 'warning':
        return {
          color: 'text-aviation-warning-500',
          bgColor: 'bg-aviation-warning-500/20',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'Warning'
        }
      case 'danger':
        return {
          color: 'text-aviation-danger-500',
          bgColor: 'bg-aviation-danger-500/20',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Critical'
        }
      default:
        return {
          color: 'text-aviation-sunset-500',
          bgColor: 'bg-aviation-sunset-500/20',
          icon: <Activity className="w-4 h-4" />,
          label: 'Unknown'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bgColor} ${className}`}>
      <div className={config.color}>
        {config.icon}
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  )
} 