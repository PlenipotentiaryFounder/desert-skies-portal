"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Plane,
  User,
  Clock
} from "lucide-react"

// This would normally fetch from the API
const mockRates = [
  {
    id: "1",
    rate_type: "aircraft",
    rate_per_hour: 150.00,
    aircraft: { tail_number: "N123AB", make: "Cessna", model: "172" },
    effective_date: "2024-01-01",
    is_active: true,
    notes: "Standard C172 rate"
  },
  {
    id: "2", 
    rate_type: "instructor",
    rate_per_hour: 65.00,
    instructor: { first_name: "Thomas", last_name: "Ferrier" },
    effective_date: "2024-01-01",
    is_active: true,
    notes: "Senior CFI rate"
  },
  {
    id: "3",
    rate_type: "ground",
    rate_per_hour: 45.00,
    effective_date: "2024-01-01",
    is_active: true,
    notes: "Ground instruction rate"
  }
]

export function BillingRatesManager() {
  const [rates, setRates] = useState(mockRates)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<any>(null)

  const handleAddRate = () => {
    setEditingRate(null)
    setIsDialogOpen(true)
  }

  const handleEditRate = (rate: any) => {
    setEditingRate(rate)
    setIsDialogOpen(true)
  }

  const handleDeleteRate = (rateId: string) => {
    if (confirm("Are you sure you want to delete this rate?")) {
      setRates(rates.filter(r => r.id !== rateId))
    }
  }

  const handleToggleActive = (rateId: string) => {
    setRates(rates.map(r => 
      r.id === rateId ? { ...r, is_active: !r.is_active } : r
    ))
  }

  const getRateIcon = (type: string) => {
    switch (type) {
      case 'aircraft': return <Plane className="w-4 h-4" />
      case 'instructor': return <User className="w-4 h-4" />
      case 'ground': return <Clock className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Billing Rates Management</CardTitle>
            <CardDescription>
              Manage hourly rates for aircraft, instructors, and services
            </CardDescription>
          </div>
          <Button onClick={handleAddRate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRateIcon(rate.rate_type)}
                    <span className="capitalize">{rate.rate_type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {rate.aircraft && (
                    <span>{rate.aircraft.tail_number} ({rate.aircraft.make} {rate.aircraft.model})</span>
                  )}
                  {rate.instructor && (
                    <span>{rate.instructor.first_name} {rate.instructor.last_name}</span>
                  )}
                  {!rate.aircraft && !rate.instructor && (
                    <span className="text-muted-foreground">General {rate.rate_type} rate</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono">${rate.rate_per_hour.toFixed(2)}/hr</span>
                </TableCell>
                <TableCell>
                  {new Date(rate.effective_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rate.is_active}
                      onCheckedChange={() => handleToggleActive(rate.id)}
                    />
                    <Badge variant={rate.is_active ? "default" : "secondary"}>
                      {rate.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRate(rate)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRate(rate.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Rate Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Rate" : "Add New Rate"}
              </DialogTitle>
              <DialogDescription>
                Configure billing rates for aircraft, instructors, or services
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rate-type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aircraft">Aircraft</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="ground">Ground Instruction</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rate" className="text-right">
                  Rate ($/hr)
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="effective-date" className="text-right">
                  Effective Date
                </Label>
                <Input
                  id="effective-date"
                  type="date"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="notes"
                  className="col-span-3"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                {editingRate ? "Update Rate" : "Add Rate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
