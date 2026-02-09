import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ATSProvider } from '@/lib/ats-context'
import { MainNav } from '@/components/main-nav'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ATS CVthèque - Applicant Tracking System',
  description: 'Manage recruitment with resume parsing, candidate scoring, and pipeline analytics',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ATSProvider>
          <MainNav />
          {children}
        </ATSProvider>
      </body>
    </html>
  )
}
