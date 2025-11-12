'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LineItem {
  id: string
  description: string
  quantity: number
  price: number
}

export default function Home() {
  const router = useRouter()
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, price: 0 }
  ])
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [network, setNetwork] = useState<'solana:devnet' | 'solana:mainnet'>('solana:devnet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: '', quantity: 1, price: 0 }
    ])
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate line items
      if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
        throw new Error('Please add at least one line item')
      }

      const subtotal = calculateSubtotal()
      if (subtotal <= 0) {
        throw new Error('Invoice total must be greater than 0')
      }

      // Convert to microunits (6 decimals for USDC)
      const amountInMicroUnits = Math.round(subtotal * 1000000)

      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInMicroUnits,
          asset: 'USDC',
          network: network,
          customerEmail: customerEmail || undefined,
          metadata: {
            invoice_number: `INV-${Date.now()}`,
            line_items: lineItems.filter(item => item.description),
            notes: notes || undefined,
            created_at: new Date().toISOString(),
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const data = await response.json()
      router.push(`/invoice/${data.intentId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SolPay Invoice Generator</h1>
          <p className="text-gray-600">Create professional invoices with Solana payments</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Network Selection */}
            <div>
              <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-2">
                Network <span className="text-red-500">*</span>
              </label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value as 'solana:devnet' | 'solana:mainnet')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                required
              >
                <option value="solana:devnet">Devnet (Testing)</option>
                <option value="solana:mainnet">Mainnet (Production)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {network === 'solana:devnet' ?
                  '⚠️ Devnet uses test tokens with no real value' :
                  '💰 Mainnet uses real USDC tokens'
                }
              </p>
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email (Optional)
              </label>
              <input
                type="email"
                id="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Line Items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Items
              </label>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="mt-3 text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                + Add Line Item
              </button>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Memo (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment due within 7 days"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Subtotal */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Subtotal:</span>
                <span className="text-2xl text-purple-600">${calculateSubtotal().toFixed(2)} USDC</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Fees will be calculated by the SolPay API
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating Invoice...' : 'Generate Invoice'}
            </button>
          </form>

          {/* Status Check Link */}
          <div className="mt-6 text-center border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">Already have an invoice?</p>
            <a
              href="/status"
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Check Invoice Status →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
