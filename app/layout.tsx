import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SolPay Invoice Generator',
  description: 'Create and manage invoices with Solana payments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
