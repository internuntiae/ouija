import type { Metadata } from 'next'

import { Kumbh_Sans } from 'next/font/google'
import './main-layout.scss'
import Header from '@/app/components/Header/Header'
import React from 'react'

const kumbhSans = Kumbh_Sans({
  variable: '--font-kumbh-sans',
  subsets: ['latin-ext'],
  weight: 'variable'
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
      <body className={`${kumbhSans.variable}`}>
        <Header />
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
