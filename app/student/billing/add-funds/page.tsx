"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  DollarSign, 
  ArrowLeft,
  Lock,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000]

export default function AddFundsPage() {
  const router = useRouter()
  const [amount, setAmount] = useState<number>(250)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card")
  const [processing, setProcessing] = useState(false)

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false)
      // In a real implementation, this would integrate with Stripe, Square, etc.
      alert(`Payment of $${amount.toFixed(2)} processed successfully!`)
      router.push('/student/billing')
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/billing">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Funds</h1>
          <p className="text-muted-foreground">
            Add money to your training account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Select Amount
            </CardTitle>
            <CardDescription>
              Choose a preset amount or enter a custom amount
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant={amount === presetAmount && !customAmount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(presetAmount)}
                  className="h-12"
                >
                  ${presetAmount}
                </Button>
              ))}
            </div>

            <Separator />

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-10"
                  min="10"
                  step="0.01"
                />
              </div>
            </div>

            {/* Selected Amount Display */}
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Amount to Add</p>
              <p className="text-3xl font-bold text-primary">${amount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
            <CardDescription>
              Select how you'd like to pay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Credit/Debit Card</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard, American Express
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" disabled />
                <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Bank Transfer</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Direct bank transfer (ACH)
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={processing || amount < 10}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Payment Information</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Funds are immediately available after payment confirmation</li>
            <li>• Minimum deposit amount is $10.00</li>
            <li>• All payments are processed securely through our payment processor</li>
            <li>• You'll receive an email confirmation once the payment is complete</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
