"use client"

import { CreateInvoiceForm } from "@/components/admin/billing/create-invoice-form"

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create New Invoice</h3>
        <p className="text-sm text-muted-foreground">
          Create a new invoice for flight instruction hours
        </p>
      </div>
      <CreateInvoiceForm />
    </div>
  )
}
