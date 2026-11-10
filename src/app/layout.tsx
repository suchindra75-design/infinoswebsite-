import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono, Roboto_Condensed } from 'next/font/google'
import { POSITIONING } from '@/content/platform'
import './globals.css'
import './intro.css'
import './studio.css'

// one typeface for the whole site (Arctic Pro): headlines, text, labels and the navigation. globals.css maps the
// display and label roles onto it (--font-display, --font-mono)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// technical annotations drawn on the product only (callouts, zone brackets, layer labels)
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-code',
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
  themeColor: '#0b141c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} ${logoFace.variable}`}>
      <body>{children}</body>
    </html>
  )
}
