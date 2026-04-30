import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'After-Care Portal',
  description: 'Digital Death Registration System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {/* We wrap the single {children} inside the Provider */}
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />

        {/* Analytics can sit safely at the bottom */}
        <Analytics />
      </body>
    </html>
  )
}
