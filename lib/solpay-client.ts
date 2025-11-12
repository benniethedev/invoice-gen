// SolPay SDK Client Wrapper
// This file wraps the SolPay x402 SDK for use in the Next.js app

export interface SolPayConfig {
  apiBase: string;
  merchantWallet: string;
  network: 'solana:devnet' | 'solana:mainnet';
  facilitatorId?: string;
  debug?: boolean;
}

export interface PaymentParams {
  amount: number;
  asset: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  intentId: string;
  paymentUrl: string;
  status: string;
  amount: {
    requested: number;
    total: number;
    fees: number;
    net: number;
  };
  receipt?: {
    url: string;
    hash: string;
    memo: string;
    signature: string;
  };
  settlement?: any;
  fees?: any;
  x402?: any;
}

export interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  amount_fees: number;
  amount_merchant: number;
  currency: string;
  customer_email?: string;
  payment_url: string;
  metadata?: Record<string, any>;
  receipt?: {
    url: string;
    sha256_hash: string;
    memo: string;
    transaction_signature: string;
  };
  settlement?: any;
  fees?: any;
  x402_context?: any;
  created_at?: string;
  updated_at?: string;
}

export class SolPayClient {
  private config: Required<SolPayConfig>;

  constructor(config: SolPayConfig) {
    this.config = {
      facilitatorId: 'facilitator.payai.network',
      debug: false,
      ...config,
    };
  }

  async createPaymentIntent(params: PaymentParams): Promise<PaymentResult> {
    const url = `${this.config.apiBase}/api/v1/payment_intents`;

    const body = {
      amount: params.amount,
      currency: params.asset,
      merchant_wallet: this.config.merchantWallet,
      customer_email: params.customerEmail,
      metadata: {
        ...params.metadata,
        sdk: 'invoice-generator',
      },
      x402_context: {
        facilitator_id: this.config.facilitatorId,
        network: this.config.network,
        resource: `${this.config.apiBase}/api/v1/payment_intents`,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-wallet': this.config.merchantWallet,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const intent = await response.json();

    return {
      intentId: intent.id,
      paymentUrl: intent.payment_url || `${this.config.apiBase}/pay/${intent.id}`,
      status: intent.status,
      amount: {
        requested: params.amount,
        total: intent.amount || params.amount,
        fees: intent.amount_fees || 0,
        net: intent.amount_merchant || params.amount,
      },
      receipt: intent.receipt ? {
        url: intent.receipt.url,
        hash: intent.receipt.sha256_hash,
        memo: intent.receipt.memo,
        signature: intent.receipt.transaction_signature,
      } : undefined,
      settlement: intent.settlement,
      fees: intent.fees,
      x402: intent.x402_context,
    };
  }

  async getPaymentIntent(intentId: string): Promise<PaymentIntent> {
    const url = `${this.config.apiBase}/api/v1/payment_intents/${intentId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Default configuration using environment variables
export function getDefaultClient(network?: 'solana:devnet' | 'solana:mainnet'): SolPayClient {
  const selectedNetwork = network || (process.env.NEXT_PUBLIC_NETWORK as 'solana:devnet' | 'solana:mainnet') || 'solana:devnet';

  // Use appropriate API base URL based on network
  const apiBase = selectedNetwork === 'solana:mainnet'
    ? (process.env.NEXT_PUBLIC_SOLPAY_API_BASE_MAINNET || 'https://www.solpay.cash')
    : (process.env.NEXT_PUBLIC_SOLPAY_API_BASE || 'https://dev.solpay.cash');

  const merchantWallet = process.env.NEXT_PUBLIC_MERCHANT_WALLET || '';

  if (!merchantWallet) {
    throw new Error('NEXT_PUBLIC_MERCHANT_WALLET environment variable is not set. Please add your Solana wallet address to .env.local');
  }

  return new SolPayClient({
    apiBase,
    merchantWallet,
    network: selectedNetwork,
    facilitatorId: process.env.NEXT_PUBLIC_FACILITATOR_ID || 'facilitator.payai.network',
    debug: process.env.NODE_ENV === 'development',
  });
}
