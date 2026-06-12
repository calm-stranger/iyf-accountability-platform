import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'IYF Sadhana — ISKCON Youth Forum Guwahati',
  description: 'A platform for youth to track their sadhana, join challenges, and grow spiritually together.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} ${jakarta.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}