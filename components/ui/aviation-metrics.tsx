"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Progress } from './progress'
import { Badge } from './badge'
import { 
  Plane, 
  Clock, 
  MapPin, 
  Wind, 
  Thermometer, 
  Eye, 
  Gauge, 
  Fuel,
  Compass,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react'

interface AviationMetricProps {
  title: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  status?: 'normal' | 'warning' | 'danger' | 'success'
  progress?: number
  maxValue?: number
  className?: string
  variant?: 'default' | 'metric' | 'status' | 'alert' | 'success'
}

export function AviationMetric({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  status = 'normal',
  progress,
  maxValue,
  className,
  variant = 'default'
}: AviationMetricProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-aviation-success-400'
      case 'warning': return 'text-aviation-warning-400'
      case 'danger': return 'text-aviation-danger-400'
      default: return 'text-aviation-sunset-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-aviation-success-400" />
      case 'down': return <TrendingDown className="w-4 h-4 text-aviation-danger-400" />
      default: return null
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-aviation-success-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-aviation-warning-400" />
      case 'danger': return <AlertTriangle className="w-4 h-4 text-aviation-danger-400" />
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card variant={variant} className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {icon && <span className={getStatusColor()}>{icon}</span>}
            {title}
            {getStatusIcon()}
          </CardTitle>
          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              {trendValue && (
                <span className="text-xs text-muted-foreground">{trendValue}</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
          {progress !== undefined && maxValue && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress}% of {maxValue}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface WeatherMetricsProps {
  temperature: number
  windSpeed: number
  visibility: number
  conditions: string
  pressure?: number
  humidity?: number
}

export function WeatherMetrics({
  temperature,
  windSpeed,
  visibility,
  conditions,
  pressure,
  humidity
}: WeatherMetricsProps) {
  return (
    <Card variant="sky" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-aviation-sky-300">
          <Thermometer className="w-5 h-5" />
          Current Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-aviation-sky-200">
            {temperature}°F
          </span>
          <Badge variant="outline" className="text-aviation-sky-300">
            {conditions}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-aviation-sky-400" />
            <span className="text-aviation-sky-300">{windSpeed} kts</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-aviation-sky-400" />
            <span className="text-aviation-sky-300">{visibility} mi</span>
          </div>
          {pressure && (
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-aviation-sky-400" />
              <span className="text-aviation-sky-300">{pressure} hPa</span>
            </div>
          )}
          {humidity && (
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-aviation-sky-400" />
              <span className="text-aviation-sky-300">{humidity}%</span>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-aviation-sky-700/30">
          <p className="text-xs text-aviation-sky-400">
            Perfect conditions for training flights
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface AircraftMetricsProps {
  fuelLevel: number
  altitude: number
  speed: number
  heading: number
  engineHours: number
  nextMaintenance: number
}

export function AircraftMetrics({
  fuelLevel,
  altitude,
  speed,
  heading,
  engineHours,
  nextMaintenance
}: AircraftMetricsProps) {
  const getFuelStatus = () => {
    if (fuelLevel < 20) return 'danger'
    if (fuelLevel < 40) return 'warning'
    return 'success'
  }

  const getMaintenanceStatus = () => {
    if (nextMaintenance < 10) return 'danger'
    if (nextMaintenance < 50) return 'warning'
    return 'success'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AviationMetric
        title="Fuel Level"
        value={fuelLevel}
        unit="%"
        icon={<Fuel className="w-4 h-4" />}
        status={getFuelStatus()}
        progress={fuelLevel}
        maxValue={100}
        variant="metric"
      />
      
      <AviationMetric
        title="Altitude"
        value={altitude}
        unit="ft"
                    icon={<TrendingUp className="w-4 h-4" />}
        variant="metric"
      />
      
      <AviationMetric
        title="Speed"
        value={speed}
        unit="kts"
                    icon={<Plane className="w-4 h-4" />}
        variant="metric"
      />
      
      <AviationMetric
        title="Heading"
        value={heading}
        unit="°"
        icon={<Compass className="w-4 h-4" />}
        variant="metric"
      />
      
      <AviationMetric
        title="Engine Hours"
        value={engineHours}
        unit="hrs"
        icon={<Clock className="w-4 h-4" />}
        variant="metric"
      />
      
      <AviationMetric
        title="Next Maintenance"
        value={nextMaintenance}
        unit="hrs"
        icon={<Plane className="w-4 h-4" />}
        status={getMaintenanceStatus()}
        variant="metric"
      />
    </div>
  )
}

interface FlightProgressProps {
  currentPhase: string
  phases: Array<{
    name: string
    completed: boolean
    current: boolean
    time?: string
  }>
  totalTime: string
  remainingTime: string
}

export function FlightProgress({
  currentPhase,
  phases,
  totalTime,
  remainingTime
}: FlightProgressProps) {
  return (
    <Card variant="dashboard" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Plane className="w-5 h-5" />
          Flight Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Phase</span>
          <Badge variant="outline" className="text-aviation-sunset-300">
            {currentPhase}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div key={phase.name} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                phase.completed 
                  ? 'bg-aviation-success-500' 
                  : phase.current 
                    ? 'bg-aviation-sunset-500 animate-pulse' 
                    : 'bg-muted'
              }`} />
              <span className={`text-sm ${
                phase.completed 
                  ? 'text-aviation-success-400' 
                  : phase.current 
                    ? 'text-aviation-sunset-300 font-medium' 
                    : 'text-muted-foreground'
              }`}>
                {phase.name}
              </span>
              {phase.time && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {phase.time}
                </span>
              )}
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Time</span>
            <span className="text-foreground">{totalTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="text-aviation-sunset-300">{remainingTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 