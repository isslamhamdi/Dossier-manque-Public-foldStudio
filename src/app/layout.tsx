// #292 Font optimization — next/font (zero layout shift, self-hosted)
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from './_page/QueryProvider'
import './globals.css'
import './interactions.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fold Studio',
  description: 'Éditeur de patrons d\'emballage 2D/3D professionnel',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Fold Studio' },
}

export const viewport: Viewport = {
  themeColor: '#e91e8c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e91e8c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fold Studio" />
      </head>
      <body suppressHydrationWarning className={inter.variable} style={{ background: '#111', color: '#e0e0e0', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        {/* #295 TanStack Query cache provider */}
        <QueryProvider>
          {children}
        </QueryProvider>
        {/* #65 PWA installable | #66 Full offline via Service Worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {})
            })
          }
        ` }} />
      </body>
    </html>
  )
}
