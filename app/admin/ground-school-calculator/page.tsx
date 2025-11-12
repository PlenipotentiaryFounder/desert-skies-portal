'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  CalendarDays,
  BookOpen,
  Home,
  Package,
  PiggyBank,
  Target,
  Award,
  Percent,
  Download
} from 'lucide-react'

interface CalculatorState {
  courseCost: number
  numberOfStudents: number
  groundsPerWeek: number
  courseLengthWeeks: number
  hoursPerGround: number
  instructorRate: number
  sportysPerStudent: number
  includeMockOral: boolean
  roomCostPerHour: number
  suppliesCost: number
}

const NORMAL_INSTRUCTOR_RATE = 75
const NORMAL_SPORTYS_COST = 300
const MOCK_ORAL_HOURS = 4

export default function GroundSchoolCalculatorPage() {
  const [state, setState] = useState<CalculatorState>({
    courseCost: 1099,
    numberOfStudents: 10,
    groundsPerWeek: 3,
    courseLengthWeeks: 4,
    hoursPerGround: 3,
    instructorRate: 50,
    sportysPerStudent: 180,
    includeMockOral: true,
    roomCostPerHour: 30,
    suppliesCost: 200,
  })

  const updateState = (field: keyof CalculatorState, value: number | boolean) => {
    setState(prev => ({ ...prev, [field]: value }))
  }

  // Calculated values
  const totalGrounds = state.groundsPerWeek * state.courseLengthWeeks
  const totalCourseHours = totalGrounds * state.hoursPerGround
  const totalMockOralHours = state.includeMockOral ? MOCK_ORAL_HOURS : 0
  const totalInstructionHours = totalCourseHours + totalMockOralHours
  
  // Costs
  const totalInstructorCosts = totalInstructionHours * state.instructorRate
  const totalSportysCosts = state.sportysPerStudent * state.numberOfStudents
  const totalRoomCost = state.roomCostPerHour * totalCourseHours
  const totalCosts = totalInstructorCosts + totalSportysCosts + totalRoomCost + state.suppliesCost
  
  // Revenue
  const totalRevenue = state.courseCost * state.numberOfStudents
  
  // Profit
  const totalProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  
  // Value to customer
  const normalInstructorCosts = totalInstructionHours * NORMAL_INSTRUCTOR_RATE
  const normalSportysCosts = NORMAL_SPORTYS_COST * state.numberOfStudents
  const normalTotalValue = normalInstructorCosts + normalSportysCosts
  const totalDiscount = normalTotalValue - (totalInstructorCosts + totalSportysCosts)
  const discountPerStudent = totalDiscount / state.numberOfStudents
  const discountPercentage = normalTotalValue > 0 ? (totalDiscount / normalTotalValue) * 100 : 0
  
  // Per student metrics
  const costPerHourToStudent = state.courseCost / totalInstructionHours
  const revenuePerStudent = state.courseCost
  const costPerStudent = totalCosts / state.numberOfStudents
  const profitPerStudent = totalProfit / state.numberOfStudents
  
  // Instructor economics
  const instructorRevenueShare = (totalInstructorCosts / totalRevenue) * 100
  const instructorDiscount = NORMAL_INSTRUCTOR_RATE - state.instructorRate
  const instructorDiscountPercent = (instructorDiscount / NORMAL_INSTRUCTOR_RATE) * 100

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatCurrencyPrecise = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const generateMarkdownReport = () => {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const markdown = `# Ground School Calculator Report
Generated: ${timestamp}

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Profit** | ${formatCurrency(totalProfit)} |
| **Total Revenue** | ${formatCurrency(totalRevenue)} |
| **Profit Margin** | ${profitMargin.toFixed(1)}% |
| **Number of Students** | ${state.numberOfStudents} |

---

## 1. PROGRAM OVERVIEW

### Course Structure
- **Course Duration:** ${state.courseLengthWeeks} weeks
- **Total Sessions:** ${totalGrounds} sessions
- **Sessions Per Week:** ${state.groundsPerWeek}
- **Hours Per Session:** ${state.hoursPerGround}h
- **Total Course Hours:** ${totalCourseHours}h (ground instruction)
${state.includeMockOral ? `- **Mock Oral Exam:** ${totalMockOralHours}h (included in course price)` : ''}
- **Total Instruction Hours:** ${totalInstructionHours}h

### Financial Summary
- **Revenue:** ${formatCurrency(totalRevenue)}
- **Costs:** ${formatCurrency(totalCosts)}
- **Profit:** ${formatCurrency(totalProfit)}
- **Margin:** ${profitMargin.toFixed(1)}%

### Key Metrics
- **Cost per hour (student perspective):** ${formatCurrencyPrecise(costPerHourToStudent)}/hr
- **Course cost per student:** ${formatCurrency(state.courseCost)}

---

## 2. FINANCIAL BREAKDOWN

### Revenue Breakdown
| Source | Amount |
|--------|--------|
| Course fees (${state.numberOfStudents} students × ${formatCurrency(state.courseCost)}) | ${formatCurrency(totalRevenue)} |
${state.includeMockOral ? `| *Includes ${MOCK_ORAL_HOURS}-hour mock oral exam (built into price)* | - |` : ''}
| **TOTAL REVENUE** | **${formatCurrency(totalRevenue)}** |

### Cost Breakdown
| Category | Details | Amount |
|----------|---------|--------|
| Instructor costs | ${totalInstructionHours}h × $${state.instructorRate}/hr | ${formatCurrency(totalInstructorCosts)} |
| Sporty's materials | ${state.numberOfStudents} students × $${state.sportysPerStudent} | ${formatCurrency(totalSportysCosts)} |
| Room rental | ${totalCourseHours}h × $${state.roomCostPerHour}/hr | ${formatCurrency(totalRoomCost)} |
| Supplies | Budget | ${formatCurrency(state.suppliesCost)} |
| **TOTAL COSTS** | | **${formatCurrency(totalCosts)}** |

### Cost Distribution (% of Revenue)
- **Instructor:** ${instructorRevenueShare.toFixed(1)}% (${formatCurrency(totalInstructorCosts)})
- **Materials:** ${((totalSportysCosts / totalRevenue) * 100).toFixed(1)}% (${formatCurrency(totalSportysCosts)})
- **Overhead:** ${(((totalRoomCost + state.suppliesCost) / totalRevenue) * 100).toFixed(1)}% (${formatCurrency(totalRoomCost + state.suppliesCost)})

### Profitability Analysis
- **Revenue:** ${formatCurrency(totalRevenue)}
- **Costs:** ${formatCurrency(totalCosts)}
- **Profit:** ${formatCurrency(totalProfit)}
- **Profit Margin:** ${profitMargin.toFixed(1)}%

---

## 3. VALUE ANALYSIS

### Customer Value Proposition

**TOTAL STUDENT SAVINGS: ${formatCurrency(totalDiscount)}**
- ${formatCurrency(discountPerStudent)} per student
- ${discountPercentage.toFixed(1)}% discount compared to regular pricing

### Regular Pricing vs. Program Pricing

#### Regular Pricing (Individual Instruction)
| Item | Amount |
|------|--------|
| Instruction (${totalInstructionHours}h × $${NORMAL_INSTRUCTOR_RATE}/hr) | ${formatCurrency(normalInstructorCosts)} |
| Sporty's materials | ${formatCurrency(normalSportysCosts)} |
| **Normal Value** | **${formatCurrency(normalTotalValue)}** |
| Per student | ${formatCurrency(normalTotalValue / state.numberOfStudents)} |

#### Program Pricing
| Item | Amount |
|------|--------|
| Instruction (${totalInstructionHours}h × $${state.instructorRate}/hr) | ${formatCurrency(totalInstructorCosts)} |
| Sporty's materials | ${formatCurrency(totalSportysCosts)} |
| **Program Cost** | **${formatCurrency(totalInstructorCosts + totalSportysCosts)}** |
| Per student | ${formatCurrency((totalInstructorCosts + totalSportysCosts) / state.numberOfStudents)} |

### Savings Breakdown
- **Instruction discount:** $${instructorDiscount}/hr × ${totalInstructionHours}h (${instructorDiscountPercent.toFixed(0)}% off) = ${formatCurrency(normalInstructorCosts - totalInstructorCosts)}
- **Materials discount:** $${NORMAL_SPORTYS_COST - state.sportysPerStudent} × ${state.numberOfStudents} students = ${formatCurrency(normalSportysCosts - totalSportysCosts)}
- **Total Savings:** ${formatCurrency(totalDiscount)}

### Marketing Points
✓ Save ${formatCurrency(discountPerStudent)} compared to individual instruction
✓ Get ${discountPercentage.toFixed(0)}% off regular pricing
✓ Only ${formatCurrencyPrecise(costPerHourToStudent)}/hour for structured ground school
✓ Includes Sporty's materials ($${NORMAL_SPORTYS_COST} value) at discounted rate
${state.includeMockOral ? `✓ Includes ${MOCK_ORAL_HOURS}-hour mock oral exam preparation` : ''}

---

## 4. PER-STUDENT ECONOMICS

### Per-Student Metrics
| Metric | Amount |
|--------|--------|
| Revenue per Student | ${formatCurrency(revenuePerStudent)} (${formatCurrencyPrecise(revenuePerStudent / totalInstructionHours)}/hr) |
| Operating Cost per Student | ${formatCurrency(costPerStudent)} (Your cost to deliver) |
| Profit per Student | ${formatCurrency(profitPerStudent)} (${profitMargin.toFixed(1)}% margin) |
| Savings per Student | ${formatCurrency(discountPerStudent)} (${discountPercentage.toFixed(1)}% discount) |

### Student Cost Breakdown
| Category | Amount per Student |
|----------|-------------------|
| Course instruction | ${formatCurrency(totalInstructorCosts / state.numberOfStudents)} |
| Sporty's materials | ${formatCurrency(state.sportysPerStudent)} |
| Room rental share | ${formatCurrency(totalRoomCost / state.numberOfStudents)} |
| Supplies share | ${formatCurrency(state.suppliesCost / state.numberOfStudents)} |
| **Total Operating Cost** | **${formatCurrency(costPerStudent)}** |

### Value Metrics
- **Effective hourly rate (student pays):** ${formatCurrencyPrecise(costPerHourToStudent)}/hr
- **Instruction hours received:** ${totalInstructionHours}h (Ground school + ${state.includeMockOral ? 'mock oral' : 'no mock oral'})
- **Normal value per student:** ${formatCurrency(normalTotalValue / state.numberOfStudents)} (if purchased individually at full price)
- **Value received:** ${formatCurrency(discountPerStudent + state.courseCost)} (Savings + course value)

### Enrollment Scenarios

| Students | Revenue | Profit | Margin | Profit/Student |
|----------|---------|--------|--------|----------------|
| ${Math.max(1, state.numberOfStudents - 2)} | ${formatCurrency(state.courseCost * Math.max(1, state.numberOfStudents - 2))} | ${formatCurrency((state.courseCost * Math.max(1, state.numberOfStudents - 2)) - totalCosts)} | ${(((state.courseCost * Math.max(1, state.numberOfStudents - 2) - totalCosts) / (state.courseCost * Math.max(1, state.numberOfStudents - 2))) * 100).toFixed(1)}% | ${formatCurrency(((state.courseCost * Math.max(1, state.numberOfStudents - 2)) - totalCosts) / Math.max(1, state.numberOfStudents - 2))} |
| ${state.numberOfStudents} (Current) | ${formatCurrency(totalRevenue)} | ${formatCurrency(totalProfit)} | ${profitMargin.toFixed(1)}% | ${formatCurrency(profitPerStudent)} |
| ${state.numberOfStudents + 2} | ${formatCurrency(state.courseCost * (state.numberOfStudents + 2))} | ${formatCurrency((state.courseCost * (state.numberOfStudents + 2)) - totalCosts)} | ${(((state.courseCost * (state.numberOfStudents + 2) - totalCosts) / (state.courseCost * (state.numberOfStudents + 2))) * 100).toFixed(1)}% | ${formatCurrency(((state.courseCost * (state.numberOfStudents + 2)) - totalCosts) / (state.numberOfStudents + 2))} |
| ${state.numberOfStudents + 5} | ${formatCurrency(state.courseCost * (state.numberOfStudents + 5))} | ${formatCurrency((state.courseCost * (state.numberOfStudents + 5)) - totalCosts)} | ${(((state.courseCost * (state.numberOfStudents + 5) - totalCosts) / (state.courseCost * (state.numberOfStudents + 5))) * 100).toFixed(1)}% | ${formatCurrency(((state.courseCost * (state.numberOfStudents + 5)) - totalCosts) / (state.numberOfStudents + 5))} |

---

## INPUT PARAMETERS

For reference, here are all the input parameters used in this calculation:

### Course Structure
- Course Length: ${state.courseLengthWeeks} weeks
- Sessions Per Week: ${state.groundsPerWeek}
- Hours Per Session: ${state.hoursPerGround}h

### Pricing
- Course Cost Per Student: ${formatCurrency(state.courseCost)}
- Number of Students: ${state.numberOfStudents}
- Include Mock Oral: ${state.includeMockOral ? 'Yes' : 'No'}

### Operating Costs
- Instructor Rate: $${state.instructorRate}/hr (Normal rate: $${NORMAL_INSTRUCTOR_RATE}/hr)
- Sporty's Cost Per Student: $${state.sportysPerStudent} (Normal cost: $${NORMAL_SPORTYS_COST})
- Room Rental: $${state.roomCostPerHour}/hr
- Supplies Budget: ${formatCurrency(state.suppliesCost)}

---

*This report was generated by the Desert Skies Aviation Ground School Calculator*
`

    // Create a blob and trigger download
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ground-school-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Ground School Calculator</h1>
          </div>
          <Button 
            onClick={generateMarkdownReport}
            className="flex items-center gap-2"
            size="lg"
          >
            <Download className="h-5 w-5" />
            Export Report
          </Button>
        </div>
        <p className="text-muted-foreground text-lg">
          Plan and optimize your accelerated ground school program with real-time financial insights
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Profit</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{profitMargin.toFixed(1)}%</p>
              </div>
              <Percent className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Students</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{state.numberOfStudents}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Course Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Course Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="courseLengthWeeks">Course Length (Weeks)</Label>
                <Input
                  id="courseLengthWeeks"
                  type="number"
                  value={state.courseLengthWeeks}
                  onChange={(e) => updateState('courseLengthWeeks', Number(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="groundsPerWeek">Sessions Per Week</Label>
                <Input
                  id="groundsPerWeek"
                  type="number"
                  value={state.groundsPerWeek}
                  onChange={(e) => updateState('groundsPerWeek', Number(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="hoursPerGround">Hours Per Session</Label>
                <Input
                  id="hoursPerGround"
                  type="number"
                  value={state.hoursPerGround}
                  onChange={(e) => updateState('hoursPerGround', Number(e.target.value))}
                  min="1"
                  step="0.5"
                />
              </div>
              <div className="pt-2 px-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">Total Sessions:</span>
                  <span className="font-semibold">{totalGrounds}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">Course Hours:</span>
                  <span className="font-semibold">{totalCourseHours}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="courseCost">Course Cost Per Student</Label>
                <Input
                  id="courseCost"
                  type="number"
                  value={state.courseCost}
                  onChange={(e) => updateState('courseCost', Number(e.target.value))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="numberOfStudents">Number of Students</Label>
                <Input
                  id="numberOfStudents"
                  type="number"
                  value={state.numberOfStudents}
                  onChange={(e) => updateState('numberOfStudents', Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="flex items-center justify-between space-x-2 pt-2">
                <div className="flex-1">
                  <Label htmlFor="includeMockOral" className="cursor-pointer">
                    Include Mock Oral ({MOCK_ORAL_HOURS}h)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Included in course cost, not an add-on
                  </p>
                </div>
                <Switch
                  id="includeMockOral"
                  checked={state.includeMockOral}
                  onCheckedChange={(checked) => updateState('includeMockOral', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Operating Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instructorRate">Instructor Rate ($/hour)</Label>
                <Input
                  id="instructorRate"
                  type="number"
                  value={state.instructorRate}
                  onChange={(e) => updateState('instructorRate', Number(e.target.value))}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Normal rate: ${NORMAL_INSTRUCTOR_RATE}/hr
                </p>
              </div>
              <div>
                <Label htmlFor="sportysPerStudent">Sporty's Cost Per Student</Label>
                <Input
                  id="sportysPerStudent"
                  type="number"
                  value={state.sportysPerStudent}
                  onChange={(e) => updateState('sportysPerStudent', Number(e.target.value))}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Normal cost: ${NORMAL_SPORTYS_COST}
                </p>
              </div>
              <div>
                <Label htmlFor="roomCostPerHour">Room Rental ($/hour)</Label>
                <Input
                  id="roomCostPerHour"
                  type="number"
                  value={state.roomCostPerHour}
                  onChange={(e) => updateState('roomCostPerHour', Number(e.target.value))}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(totalRoomCost)} ({totalCourseHours}h)
                </p>
              </div>
              <div>
                <Label htmlFor="suppliesCost">Supplies Budget</Label>
                <Input
                  id="suppliesCost"
                  type="number"
                  value={state.suppliesCost}
                  onChange={(e) => updateState('suppliesCost', Number(e.target.value))}
                  min="0"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="value">Value Analysis</TabsTrigger>
              <TabsTrigger value="per-student">Per Student</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Program Summary</CardTitle>
                  <CardDescription>Key metrics and program structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          Course Duration
                        </span>
                        <span className="font-bold">{state.courseLengthWeeks} weeks</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          Total Sessions
                        </span>
                        <span className="font-bold">{totalGrounds} sessions</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Total Hours
                        </span>
                        <span className="font-bold">{totalInstructionHours}h</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Students
                        </span>
                        <span className="font-bold">{state.numberOfStudents}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Revenue</span>
                        <span className="font-bold text-green-700 dark:text-green-300">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">Costs</span>
                        <span className="font-bold text-red-700 dark:text-red-300">{formatCurrency(totalCosts)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Profit</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalProfit)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Margin</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">{profitMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Program Details
                    </h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between p-2 hover:bg-muted rounded">
                        <span className="text-muted-foreground">Course hours (ground instruction)</span>
                        <span className="font-medium">{totalCourseHours}h</span>
                      </div>
                      {state.includeMockOral && (
                        <div className="flex justify-between p-2 hover:bg-muted rounded">
                          <span className="text-muted-foreground">Mock oral exam hours</span>
                          <span className="font-medium">{totalMockOralHours}h</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 hover:bg-muted rounded">
                        <span className="text-muted-foreground">Sessions per week</span>
                        <span className="font-medium">{state.groundsPerWeek}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-muted rounded">
                        <span className="text-muted-foreground">Hours per session</span>
                        <span className="font-medium">{state.hoursPerGround}h</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-muted rounded">
                        <span className="text-muted-foreground">Cost per hour (student perspective)</span>
                        <span className="font-medium">{formatCurrencyPrecise(costPerHourToStudent)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Course fees ({state.numberOfStudents} students × {formatCurrency(state.courseCost)})</span>
                      <span className="font-bold text-lg">{formatCurrency(totalRevenue)}</span>
                    </div>
                    {state.includeMockOral && (
                      <div className="pl-4 text-sm text-muted-foreground">
                        <div className="flex justify-between p-2">
                          <span>Includes {MOCK_ORAL_HOURS}-hour mock oral exam (built into course price)</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <span className="font-bold text-green-700 dark:text-green-300">TOTAL REVENUE</span>
                      <span className="font-bold text-2xl text-green-700 dark:text-green-300">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Instructor costs</div>
                        <div className="text-sm text-muted-foreground">{totalInstructionHours}h × ${state.instructorRate}/hr</div>
                      </div>
                      <span className="font-bold">{formatCurrency(totalInstructorCosts)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Sporty's materials</div>
                        <div className="text-sm text-muted-foreground">{state.numberOfStudents} students × ${state.sportysPerStudent}</div>
                      </div>
                      <span className="font-bold">{formatCurrency(totalSportysCosts)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Room rental</div>
                        <div className="text-sm text-muted-foreground">{totalCourseHours}h × ${state.roomCostPerHour}/hr</div>
                      </div>
                      <span className="font-bold">{formatCurrency(totalRoomCost)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="font-medium">Supplies</div>
                      <span className="font-bold">{formatCurrency(state.suppliesCost)}</span>
                    </div>

                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800">
                      <span className="font-bold text-red-700 dark:text-red-300">TOTAL COSTS</span>
                      <span className="font-bold text-2xl text-red-700 dark:text-red-300">{formatCurrency(totalCosts)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Revenue</div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalRevenue)}</div>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 text-center">
                        <div className="text-sm text-red-600 dark:text-red-400 mb-1">Costs</div>
                        <div className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalCosts)}</div>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 text-center">
                        <div className="text-sm text-green-600 dark:text-green-400 mb-1">Profit</div>
                        <div className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalProfit)}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Profit Margin</div>
                          <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{profitMargin.toFixed(1)}%</div>
                        </div>
                        <Target className="h-12 w-12 text-purple-400" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <h4 className="font-semibold text-sm text-muted-foreground">COST DISTRIBUTION</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Instructor ({instructorRevenueShare.toFixed(1)}% of revenue)</span>
                            <span className="font-medium">{formatCurrency(totalInstructorCosts)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${(totalInstructorCosts / totalRevenue) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Materials ({((totalSportysCosts / totalRevenue) * 100).toFixed(1)}% of revenue)</span>
                            <span className="font-medium">{formatCurrency(totalSportysCosts)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500" 
                              style={{ width: `${(totalSportysCosts / totalRevenue) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overhead ({(((totalRoomCost + state.suppliesCost) / totalRevenue) * 100).toFixed(1)}% of revenue)</span>
                            <span className="font-medium">{formatCurrency(totalRoomCost + state.suppliesCost)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500" 
                              style={{ width: `${((totalRoomCost + state.suppliesCost) / totalRevenue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Value Analysis Tab */}
            <TabsContent value="value" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Value Proposition</CardTitle>
                  <CardDescription>What students save by enrolling in this program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <div className="text-sm text-green-600 dark:text-green-400 mb-2">TOTAL STUDENT SAVINGS</div>
                      <div className="text-4xl font-bold text-green-700 dark:text-green-300 mb-2">{formatCurrency(totalDiscount)}</div>
                      <div className="text-lg text-green-600 dark:text-green-400">
                        {formatCurrency(discountPerStudent)} per student ({discountPercentage.toFixed(1)}% discount)
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Regular Pricing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Instruction ({totalInstructionHours}h × ${NORMAL_INSTRUCTOR_RATE}/hr)</span>
                          <span className="font-medium">{formatCurrency(normalInstructorCosts)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sporty's materials</span>
                          <span className="font-medium">{formatCurrency(normalSportysCosts)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Normal Value</span>
                          <span>{formatCurrency(normalTotalValue)}</span>
                        </div>
                        <div className="text-xs text-center text-muted-foreground pt-2">
                          {formatCurrency(normalTotalValue / state.numberOfStudents)} per student
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Program Pricing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Instruction ({totalInstructionHours}h × ${state.instructorRate}/hr)</span>
                          <span className="font-medium">{formatCurrency(totalInstructorCosts)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sporty's materials</span>
                          <span className="font-medium">{formatCurrency(totalSportysCosts)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-primary">
                          <span>Program Cost</span>
                          <span>{formatCurrency(totalInstructorCosts + totalSportysCosts)}</span>
                        </div>
                        <div className="text-xs text-center text-muted-foreground pt-2">
                          {formatCurrency((totalInstructorCosts + totalSportysCosts) / state.numberOfStudents)} per student
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <PiggyBank className="h-5 w-5" />
                        Savings Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div>
                          <div className="font-medium">Instruction discount</div>
                          <div className="text-sm text-muted-foreground">
                            ${instructorDiscount}/hr × {totalInstructionHours}h ({instructorDiscountPercent.toFixed(0)}% off)
                          </div>
                        </div>
                        <span className="font-bold text-green-600">{formatCurrency(normalInstructorCosts - totalInstructorCosts)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div>
                          <div className="font-medium">Materials discount</div>
                          <div className="text-sm text-muted-foreground">
                            ${NORMAL_SPORTYS_COST - state.sportysPerStudent} × {state.numberOfStudents} students
                          </div>
                        </div>
                        <span className="font-bold text-green-600">{formatCurrency(normalSportysCosts - totalSportysCosts)}</span>
                      </div>

                      <Separator />
                      
                      <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <span className="font-bold">Total Savings</span>
                        <span className="font-bold text-lg text-green-700 dark:text-green-300">{formatCurrency(totalDiscount)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Marketing Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5">✓</Badge>
                          <span className="text-sm">
                            Save <strong>{formatCurrency(discountPerStudent)}</strong> compared to individual instruction
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5">✓</Badge>
                          <span className="text-sm">
                            Get <strong>{discountPercentage.toFixed(0)}% off</strong> regular pricing
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5">✓</Badge>
                          <span className="text-sm">
                            Only <strong>{formatCurrencyPrecise(costPerHourToStudent)}/hour</strong> for structured ground school
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5">✓</Badge>
                          <span className="text-sm">
                            Includes Sporty's materials (${NORMAL_SPORTYS_COST} value) at discounted rate
                          </span>
                        </li>
                        {state.includeMockOral && (
                          <li className="flex items-start gap-2">
                            <Badge variant="secondary" className="mt-0.5">✓</Badge>
                            <span className="text-sm">
                              Includes {MOCK_ORAL_HOURS}-hour mock oral exam preparation
                            </span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Per Student Tab */}
            <TabsContent value="per-student" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Per-Student Economics</CardTitle>
                  <CardDescription>Individual student metrics and analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Revenue per Student</div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(revenuePerStudent)}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {formatCurrencyPrecise(revenuePerStudent / totalInstructionHours)}/hour
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-1">Operating Cost per Student</div>
                      <div className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(costPerStudent)}</div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Your cost to deliver the program
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm text-green-600 dark:text-green-400 mb-1">Profit per Student</div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(profitPerStudent)}</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {profitMargin.toFixed(1)}% margin
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Savings per Student</div>
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(discountPerStudent)}</div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {discountPercentage.toFixed(1)}% discount
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Student Cost Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Course instruction</span>
                        <span className="font-medium">{formatCurrency(totalInstructorCosts / state.numberOfStudents)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Sporty's materials</span>
                        <span className="font-medium">{formatCurrency(state.sportysPerStudent)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Room rental share</span>
                        <span className="font-medium">{formatCurrency(totalRoomCost / state.numberOfStudents)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Supplies share</span>
                        <span className="font-medium">{formatCurrency(state.suppliesCost / state.numberOfStudents)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Value Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <div className="text-sm font-medium">Effective hourly rate (student pays)</div>
                          <div className="text-xs text-muted-foreground">Total course cost ÷ instruction hours</div>
                        </div>
                        <span className="font-bold">{formatCurrencyPrecise(costPerHourToStudent)}/hr</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <div className="text-sm font-medium">Instruction hours received</div>
                          <div className="text-xs text-muted-foreground">Ground school + {state.includeMockOral ? 'mock oral' : 'no mock oral'}</div>
                        </div>
                        <span className="font-bold">{totalInstructionHours}h</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <div className="text-sm font-medium">Normal value per student</div>
                          <div className="text-xs text-muted-foreground">If purchased individually at full price</div>
                        </div>
                        <span className="font-bold">{formatCurrency(normalTotalValue / state.numberOfStudents)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div>
                          <div className="text-sm font-medium text-green-700 dark:text-green-300">Value received</div>
                          <div className="text-xs text-green-600 dark:text-green-400">Savings + course value</div>
                        </div>
                        <span className="font-bold text-green-700 dark:text-green-300">{formatCurrency(discountPerStudent + state.courseCost)}</span>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800">
                    <CardHeader>
                      <CardTitle className="text-base">Enrollment Scenarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          Math.max(1, state.numberOfStudents - 2),
                          state.numberOfStudents,
                          state.numberOfStudents + 2,
                          state.numberOfStudents + 5
                        ].map((studentCount) => {
                          const scenarioRevenue = state.courseCost * studentCount
                          const scenarioProfit = scenarioRevenue - totalCosts
                          const scenarioMargin = (scenarioProfit / scenarioRevenue) * 100
                          
                          return (
                            <div 
                              key={studentCount}
                              className={`p-3 rounded-lg ${
                                studentCount === state.numberOfStudents 
                                  ? 'bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-300 dark:border-indigo-700' 
                                  : 'bg-white/50 dark:bg-black/20'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {studentCount} students
                                    {studentCount === state.numberOfStudents && (
                                      <Badge variant="secondary">Current</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(scenarioRevenue)} revenue · {scenarioMargin.toFixed(1)}% margin
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${scenarioProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(scenarioProfit)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(scenarioProfit / studentCount)}/student
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

