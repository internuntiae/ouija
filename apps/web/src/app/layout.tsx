import type { Metadata } from 'next'

import { Geist, Geist_Mono } from 'next/font/google'
import './main-layout.scss'
import Header from '@/app/components/Header/Header'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'ouija',
  description: 'i love cats :3'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
