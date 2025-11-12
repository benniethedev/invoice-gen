'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'

interface InvoiceData {
  id: string
  status: string
  amount: number
  amount_fees: number
  amount_merchant: number
  currency: string
  customer_email?: string
  payment_url: string
  metadata?: {
    invoice_number?: string
    line_items?: Array<{
      description: string
      quantity: number
      price: number
    }>
    notes?: string
    created_at?: string
  }
  receipt?: {
    url: string
    sha256_hash: string
    memo: string
    transaction_signature: string
  }
  x402_context?: {
    network: string
  }
}

export default function InvoicePage() {
  const params = useParams()
  const intentId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (intentId) {
      fetchInvoice()
    }
  }, [intentId])

  useEffect(() => {
    // Poll for updates every 5 seconds if payment is pending
    if (invoice?.status === 'pending') {
      const interval = setInterval(() => {
        fetchInvoice()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [invoice?.status])

  const fetchInvoice = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_SOLPAY_API_BASE || 'https://dev.solpay.cash'
      console.log('Fetching invoice:', intentId, 'from', apiBase)

      const response = await fetch(`${apiBase}/api/v1/payment_intents/${intentId}`, {
        cache: 'no-store',
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching invoice:', errorData)
        throw new Error(errorData.error || `Failed to load invoice (${response.status})`)
      }

      const data = await response.json()
      console.log('Invoice data:', data)

      // Add fallback payment_url if not provided by API
      if (!data.payment_url) {
        data.payment_url = `${apiBase}/pay/${intentId}`
      }

      setInvoice(data)

      setLoading(false)

      // Generate QR code after state is set (client-side only)
      if (typeof window !== 'undefined' && data.payment_url) {
        try {
          const qrCode = await QRCode.toDataURL(data.payment_url, {
            width: 300,
            margin: 2,
            color: {
              dark: '#7c3aed',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          })
          setQrCodeUrl(qrCode)
        } catch (qrErr) {
          console.error('QR Code generation error:', qrErr)
          // Continue anyway, just won't show QR code
        }
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getExplorerUrl = (signature: string) => {
    const network = invoice?.x402_context?.network?.includes('devnet') ? 'devnet' : 'mainnet-beta'
    return `https://explorer.solana.com/tx/${signature}?cluster=${network}`
  }

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Create New Invoice
            </a>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === 'succeeded' || invoice.status === 'completed'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoice</h1>
          <p className="text-gray-600">{invoice.metadata?.invoice_number || intentId}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Details</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.x402_context?.network?.includes('mainnet')
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {invoice.x402_context?.network?.includes('mainnet') ? '💰 Mainnet' : '🧪 Devnet'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isPaid ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              {invoice.customer_email && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{invoice.customer_email}</p>
                </div>
              )}

              {invoice.metadata?.created_at && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(invoice.metadata.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Line Items */}
            {invoice.metadata?.line_items && invoice.metadata.line_items.length > 0 && (
              <div className="mb-6 border-t pt-6">
                <h3 className="font-semibold mb-3">Line Items</h3>
                <div className="space-y-2">
                  {invoice.metadata.line_items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.description} × {item.quantity}
                      </span>
                      <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Breakdown */}
            <div className="border-t pt-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${formatAmount(invoice.amount)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fees</span>
                <span className="font-medium">${formatAmount(invoice.amount_fees)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>You Receive</span>
                <span className="text-purple-600">${formatAmount(invoice.amount_merchant)} {invoice.currency}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.metadata?.notes && (
              <div className="mt-6 border-t pt-6">
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-gray-700">{invoice.metadata.notes}</p>
              </div>
            )}

            {/* Receipt Info */}
            {invoice.receipt && (
              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold mb-3 text-green-700">✓ Payment Confirmed</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Transaction</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 p-1 rounded flex-1 overflow-hidden text-ellipsis">
                        {invoice.receipt.transaction_signature.slice(0, 20)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(invoice.receipt!.transaction_signature)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        {copied ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                  <a
                    href={getExplorerUrl(invoice.receipt.transaction_signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-600 hover:text-purple-800"
                  >
                    View on Solana Explorer →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {isPaid ? 'Payment Complete' : 'Scan to Pay'}
              </h2>

              {!isPaid && (
                <>
                  {qrCodeUrl && (
                    <div className="bg-white p-4 rounded-lg inline-block mb-6 border-4 border-purple-100">
                      <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64" />
                    </div>
                  )}
                  {!qrCodeUrl && (
                    <div className="bg-white p-4 rounded-lg inline-block mb-6 border-4 border-purple-100 w-64 h-64 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-sm">Generating QR code...</p>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Or use this link:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={invoice.payment_url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(invoice.payment_url)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        {copied ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <a
                    href={invoice.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Pay with Phantom Wallet
                  </a>

                  <p className="text-xs text-gray-500 mt-4">
                    This page will automatically update when payment is received
                  </p>
                </>
              )}

              {isPaid && (
                <div className="text-center py-8">
                  <div className="text-green-500 text-6xl mb-4">✓</div>
                  <p className="text-xl font-semibold text-gray-900 mb-2">Payment Received!</p>
                  <p className="text-gray-600">Thank you for your payment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Intent ID */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Payment Intent ID: <code className="bg-white px-2 py-1 rounded text-purple-600">{intentId}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center space-x-4">
          <a
            href="/"
            className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-lg border border-gray-300 transition-colors"
          >
            Create New Invoice
          </a>
          <button
            onClick={() => window.print()}
            className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-lg border border-gray-300 transition-colors"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
