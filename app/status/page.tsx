'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StatusPage() {
  const router = useRouter()
  const [intentId, setIntentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate intent ID format
      if (!intentId.startsWith('pi_')) {
        throw new Error('Invalid payment intent ID. It should start with "pi_"')
      }

      // Try to fetch the payment intent to validate it exists
      const apiBase = process.env.NEXT_PUBLIC_SOLPAY_API_BASE || 'https://dev.solpay.cash'
      const response = await fetch(`${apiBase}/api/v1/payment_intents/${intentId}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Invoice not found. Please check the payment intent ID.')
      }

      // Redirect to invoice page
      router.push(`/invoice/${intentId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Check Invoice Status</h1>
          <p className="text-gray-600">Enter your payment intent ID to view invoice details</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="intentId" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Intent ID
              </label>
              <input
                type="text"
                id="intentId"
                value={intentId}
                onChange={(e) => setIntentId(e.target.value.trim())}
                placeholder="pi_1234567890_abcdef"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Payment intent IDs start with "pi_"
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? 'Checking...' : 'View Invoice'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 How to find your Payment Intent ID</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Check the invoice page URL: /invoice/<strong>pi_xxx</strong></li>
                <li>• Look at the bottom of your invoice</li>
                <li>• Check your email confirmation (if provided)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">Need to create an invoice?</p>
            <a
              href="/"
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              ← Back to Invoice Generator
            </a>
          </div>
        </div>

        {/* Example IDs (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800 font-semibold mb-2">Development Mode</p>
            <p className="text-xs text-yellow-700">
              You can test with any payment intent ID from the SolPay API
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
