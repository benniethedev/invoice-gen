import { NextRequest, NextResponse } from 'next/server'
import { getDefaultClient } from '@/lib/solpay-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, asset, network, customerEmail, metadata } = body

    // Validate required fields
    if (!amount || !asset) {
      return NextResponse.json(
        { error: 'Amount and asset are required' },
        { status: 400 }
      )
    }

    // Validate network
    if (network && !['solana:devnet', 'solana:mainnet'].includes(network)) {
      return NextResponse.json(
        { error: 'Invalid network. Must be solana:devnet or solana:mainnet' },
        { status: 400 }
      )
    }

    // Create payment intent using SolPay client
    const client = getDefaultClient(network)
    const result = await client.createPaymentIntent({
      amount,
      asset,
      customerEmail,
      metadata,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
