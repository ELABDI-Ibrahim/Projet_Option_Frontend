import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ATSProvider } from '@/lib/ats-context'
import { ErrorProvider } from '@/lib/error-context'
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
        <ErrorProvider>
          <ATSProvider>
            <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
              <div className="flex-none z-10 relative">
                <MainNav />
              </div>
              <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full">
                {children}
              </main>
            </div>
          </ATSProvider>
        </ErrorProvider>
      </body>
    </html>
  )
}
