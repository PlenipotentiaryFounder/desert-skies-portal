"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Gauge, 
  Wind, 
  Thermometer,
  Compass,
  Fuel,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Plane,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity as ActivityIcon
} from 'lucide-react'

// Chart Types
export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'radar' | 'composed'

// Base Chart Props
interface BaseChartProps {
  title: string
  subtitle?: string
  data: any[]
  className?: string
  variant?: 'default' | 'glass' | 'aviation' | 'sunset' | 'sky' | 'night'
  height?: number
  loading?: boolean
  error?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

// Line Chart Component
export function AviationLineChart({
  title,
  subtitle,
  data,
  className,
  variant = 'aviation',
  height = 300,
  loading,
  error,
  icon,
  actions,
  xKey = 'name',
  yKey = 'value',
  strokeColor = '#FFB347',
  fillColor = 'rgba(255, 179, 71, 0.1)',
  showGrid = true,
  showTooltip = true,
  animate = true
}: BaseChartProps & {
  xKey?: string
  yKey?: string
  strokeColor?: string
  fillColor?: string
  showGrid?: boolean
  showTooltip?: boolean
  animate?: boolean
}) {
  if (loading) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-aviation-danger-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-aviation-danger-500">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon || <LineChartIcon className="w-5 h-5" />}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5 }}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis 
                dataKey={xKey} 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              {showTooltip && (
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,179,71,0.3)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={strokeColor}
                strokeWidth={3}
                dot={{ fill: strokeColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: strokeColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Area Chart Component
export function AviationAreaChart({
  title,
  subtitle,
  data,
  className,
  variant = 'aviation',
  height = 300,
  loading,
  error,
  icon,
  actions,
  xKey = 'name',
  yKey = 'value',
  fillColor = 'rgba(255, 179, 71, 0.3)',
  strokeColor = '#FFB347',
  showGrid = true,
  showTooltip = true,
  animate = true
}: BaseChartProps & {
  xKey?: string
  yKey?: string
  fillColor?: string
  strokeColor?: string
  showGrid?: boolean
  showTooltip?: boolean
  animate?: boolean
}) {
  if (loading) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon || <ActivityIcon className="w-5 h-5" />}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5 }}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis 
                dataKey={xKey} 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              {showTooltip && (
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,179,71,0.3)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={strokeColor}
                fill={fillColor}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Bar Chart Component
export function AviationBarChart({
  title,
  subtitle,
  data,
  className,
  variant = 'aviation',
  height = 300,
  loading,
  error,
  icon,
  actions,
  xKey = 'name',
  yKey = 'value',
  fillColor = '#FFB347',
  showGrid = true,
  showTooltip = true,
  animate = true
}: BaseChartProps & {
  xKey?: string
  yKey?: string
  fillColor?: string
  showGrid?: boolean
  showTooltip?: boolean
  animate?: boolean
}) {
  if (loading) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon || <BarChart3 className="w-5 h-5" />}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5 }}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis 
                dataKey={xKey} 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              {showTooltip && (
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,179,71,0.3)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              )}
              <Bar dataKey={yKey} fill={fillColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Pie Chart Component
export function AviationPieChart({
  title,
  subtitle,
  data,
  className,
  variant = 'aviation',
  height = 300,
  loading,
  error,
  icon,
  actions,
  dataKey = 'value',
  nameKey = 'name',
  colors = ['#FFB347', '#1E3A8A', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
  animate = true
}: BaseChartProps & {
  dataKey?: string
  nameKey?: string
  colors?: string[]
  animate?: boolean
}) {
  if (loading) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon || <PieChartIcon className="w-5 h-5" />}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={animate ? { opacity: 0, scale: 0.9 } : false}
          animate={animate ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.5 }}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,179,71,0.3)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Radar Chart Component
export function AviationRadarChart({
  title,
  subtitle,
  data,
  className,
  variant = 'aviation',
  height = 300,
  loading,
  error,
  icon,
  actions,
  dataKey = 'value',
  animate = true
}: BaseChartProps & {
  dataKey?: string
  animate?: boolean
}) {
  if (loading) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon || <Target className="w-5 h-5" />}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={animate ? { opacity: 0, rotate: -10 } : false}
          animate={animate ? { opacity: 1, rotate: 0 } : false}
          transition={{ duration: 0.5 }}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              />
              <Radar
                name="Performance"
                dataKey={dataKey}
                stroke="#FFB347"
                fill="rgba(255, 179, 71, 0.3)"
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,179,71,0.3)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Composed Chart Component
export function AviationComposedChart({
  title,
  subtitle,
  data,
  className,
  variant = 'aviation',
  height = 300,
  loading,
  error,
  icon,
  actions,
  xKey = 'name',
  lineKey = 'lineValue',
  barKey = 'barValue',
  areaKey = 'areaValue',
  animate = true
}: BaseChartProps & {
  xKey?: string
  lineKey?: string
  barKey?: string
  areaKey?: string
  animate?: boolean
}) {
  if (loading) {
    return (
      <Card variant={variant} className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-sunset-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant={variant} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon || <ActivityIcon className="w-5 h-5" />}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5 }}
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xKey} 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,179,71,0.3)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              {areaKey && (
                <Area
                  type="monotone"
                  dataKey={areaKey}
                  fill="rgba(255, 179, 71, 0.1)"
                  stroke="rgba(255, 179, 71, 0.5)"
                  strokeWidth={1}
                />
              )}
              {barKey && (
                <Bar dataKey={barKey} fill="rgba(30, 58, 138, 0.6)" radius={[2, 2, 0, 0]} />
              )}
              {lineKey && (
                <Line
                  type="monotone"
                  dataKey={lineKey}
                  stroke="#FFB347"
                  strokeWidth={3}
                  dot={{ fill: '#FFB347', strokeWidth: 2, r: 4 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Flight Performance Chart
export function FlightPerformanceChart({ data, className }: { data: any[], className?: string }) {
  return (
    <AviationComposedChart
      title="Flight Performance"
      subtitle="Altitude, Speed, and Fuel Consumption"
      data={data}
      className={className}
      icon={<Plane className="w-5 h-5" />}
      xKey="time"
      lineKey="altitude"
      barKey="speed"
      areaKey="fuel"
    />
  )
}

// Weather Trend Chart
export function WeatherTrendChart({ data, className }: { data: any[], className?: string }) {
  return (
    <AviationLineChart
      title="Weather Conditions"
      subtitle="Temperature and Wind Speed Trends"
      data={data}
      className={className}
      icon={<Wind className="w-5 h-5" />}
      xKey="time"
      yKey="temperature"
      strokeColor="#FFB347"
    />
  )
}

// Student Progress Chart
export function StudentProgressChart({ data, className }: { data: any[], className?: string }) {
  return (
    <AviationBarChart
      title="Student Progress"
      subtitle="Lesson Completion Rates"
      data={data}
      className={className}
      icon={<Users className="w-5 h-5" />}
      xKey="student"
      yKey="progress"
      fillColor="#10B981"
    />
  )
}

// Aircraft Utilization Chart
export function AircraftUtilizationChart({ data, className }: { data: any[], className?: string }) {
  return (
    <AviationPieChart
      title="Aircraft Utilization"
      subtitle="Flight Hours by Aircraft"
      data={data}
      className={className}
      icon={<Plane className="w-5 h-5" />}
      dataKey="hours"
      nameKey="aircraft"
    />
  )
}

// Maneuver Performance Chart
export function ManeuverPerformanceChart({ data, className }: { data: any[], className?: string }) {
  return (
    <AviationRadarChart
      title="Maneuver Performance"
      subtitle="Student Proficiency by Maneuver Type"
      data={data}
      className={className}
      icon={<Target className="w-5 h-5" />}
      dataKey="score"
    />
  )
}

// Revenue Trend Chart
export function RevenueTrendChart({ data, className }: { data: any[], className?: string }) {
  return (
    <AviationAreaChart
      title="Revenue Trends"
      subtitle="Monthly Revenue and Growth"
      data={data}
      className={className}
      icon={<TrendingUp className="w-5 h-5" />}
      xKey="month"
      yKey="revenue"
      fillColor="rgba(16, 185, 129, 0.3)"
      strokeColor="#10B981"
    />
  )
} 