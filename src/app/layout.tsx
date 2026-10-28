import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans, IBM_Plex_Mono, Roboto_Condensed } from 'next/font/google'
import { POSITIONING } from '@/content/platform'
import './globals.css'
import './intro.css'
import './studio.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

// the INFINOS wordmark face (matched to the logo artwork: x-height, ascender and width within 1 %), used by the intro
const logoFace = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-logo',
  display: 'block',
})

export const metadata: Metadata = {
  title: POSITIONING.headline,
  description: `${POSITIONING.companyLine} ${POSITIONING.currentLine}`,
}

export const viewport: Viewport = {
  themeColor: '#0a0b0e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${plexMono.variable} ${logoFace.variable}`}>
      <body>{children}</body>
    </html>
  )
}
