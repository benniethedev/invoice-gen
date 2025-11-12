# SolPay Invoice Generator

A simple, beautiful invoice generator powered by the SolPay x402 SDK. Create professional invoices with QR codes for Solana payments - no database or backend required!

## ✨ Features

- 📝 **Easy Invoice Creation** - Simple form to create invoices with line items
- 🎨 **Beautiful UI** - Clean, modern interface built with Tailwind CSS
- 📱 **QR Code Support** - Auto-generated QR codes for easy mobile payments
- 💳 **Solana Payments** - Accept USDC payments on Solana devnet/mainnet
- 🔍 **Status Tracking** - Check invoice status anytime with payment intent ID
- 🎯 **No Database** - All data stored via SolPay API
- 🚀 **Vercel Ready** - Deploy instantly to Vercel

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd invoice-generator
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SOLPAY_API_BASE=https://dev.solpay.cash
NEXT_PUBLIC_MERCHANT_WALLET=YOUR_SOLANA_WALLET_ADDRESS
NEXT_PUBLIC_NETWORK=solana:devnet
NEXT_PUBLIC_FACILITATOR_ID=facilitator.payai.network
```

**Important:** Replace `YOUR_SOLANA_WALLET_ADDRESS` with your actual Solana wallet address!

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your invoice generator!

## 📖 How It Works

### Creating an Invoice

1. Fill in customer email (optional)
2. Add line items with descriptions, quantities, and prices
3. Add notes/memo (optional)
4. Click "Generate Invoice"
5. Get a unique invoice page with QR code

### Paying an Invoice

1. Scan the QR code with your Phantom wallet
2. Or click the payment link
3. Complete the payment on SolPay hosted page
4. Invoice automatically updates to "Paid" status

### Checking Invoice Status

1. Go to the Status page
2. Enter your payment intent ID (starts with `pi_`)
3. View complete invoice details and payment status

## 🏗️ Architecture

```
invoice-generator/
├── app/
│   ├── api/
│   │   └── create-invoice/route.ts    # API route to create invoices
│   ├── invoice/[id]/page.tsx          # Invoice display with QR code
│   ├── status/page.tsx                # Status lookup page
│   ├── page.tsx                       # Home page (invoice form)
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Tailwind styles
├── lib/
│   └── solpay-client.ts               # SolPay SDK wrapper
└── .env.local                         # Environment variables
```

## 🌐 Deploying to Vercel

### Option 1: Deploy from GitHub

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SOLPAY_API_BASE`
   - `NEXT_PUBLIC_MERCHANT_WALLET`
   - `NEXT_PUBLIC_NETWORK`
   - `NEXT_PUBLIC_FACILITATOR_ID`
6. Click "Deploy"

### Option 2: Deploy with Vercel CLI

```bash
npm install -g vercel
vercel
```

## 🎯 Use Cases

- **Freelancers** - Send professional invoices to clients
- **Small Businesses** - Accept crypto payments easily
- **Service Providers** - Generate payment links on the fly
- **Online Stores** - Create custom checkout experiences

## 🔒 Security

- All payments processed through SolPay's secure API
- No sensitive data stored locally
- Payment intents stored on SolPay servers
- x402 protocol ensures proper network verification

## 💡 Key Features

### Invoice Metadata

All invoice details are stored in the payment intent metadata:

```typescript
{
  invoice_number: "INV-1234567890",
  line_items: [
    { description: "Website Design", quantity: 1, price: 100 }
  ],
  notes: "Payment due within 7 days",
  created_at: "2024-01-01T00:00:00Z"
}
```

### QR Code Generation

QR codes are generated client-side using the `qrcode` library and point directly to the SolPay hosted payment page.

### Auto-Refresh

Invoice pages automatically poll for payment status updates every 5 seconds when payment is pending.

### Amount Breakdown

Displays:
- Subtotal (requested amount)
- Processing fees (calculated by SolPay)
- Merchant receives (net amount)

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **QRCode** - QR code generation
- **SolPay x402 SDK** - Payment processing

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLPAY_API_BASE` | SolPay API base URL | `https://dev.solpay.cash` |
| `NEXT_PUBLIC_MERCHANT_WALLET` | Your Solana wallet address | `7xF2...Ab3d` |
| `NEXT_PUBLIC_NETWORK` | Solana network | `solana:devnet` or `solana:mainnet` |
| `NEXT_PUBLIC_FACILITATOR_ID` | x402 facilitator ID | `facilitator.payai.network` |

## 🎨 Customization

### Colors

Edit `tailwind.config.ts` to customize the color scheme:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#7c3aed', // Purple
      // Add your colors
    },
  },
}
```

### Branding

Update the app metadata in `app/layout.tsx`:

```typescript
export const metadata = {
  title: 'Your Company - Invoices',
  description: 'Your custom description',
}
```

## 📚 API Reference

### Create Invoice

**POST** `/api/create-invoice`

```json
{
  "amount": 100000000,
  "asset": "USDC",
  "customerEmail": "customer@example.com",
  "metadata": {
    "invoice_number": "INV-123",
    "line_items": [...],
    "notes": "Payment terms"
  }
}
```

**Response:**

```json
{
  "intentId": "pi_1234567890_abc",
  "paymentUrl": "https://dev.solpay.cash/pay/pi_1234567890_abc",
  "status": "pending",
  "amount": { ... }
}
```

## 🐛 Troubleshooting

### Invoice not loading?

- Check that payment intent ID is correct
- Verify your network connection
- Ensure SolPay API is accessible

### QR code not generating?

- Check browser console for errors
- Verify payment URL is valid
- Try refreshing the page

### Payment not updating?

- Payment status updates every 5 seconds
- Try manually refreshing the page
- Check transaction on Solana Explorer

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 🔗 Links

- [SolPay Documentation](https://dev.solpay.cash)
- [Solana Explorer](https://explorer.solana.com)
- [Next.js Docs](https://nextjs.org/docs)

---

Built with ❤️ using SolPay x402 SDK
