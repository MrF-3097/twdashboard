import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import dynamic from 'next/dynamic'

// Dynamically import debug components to avoid SSR issues
const OnScreenDebugPanel = dynamic(() => import('@/components/debug/on-screen-debug-panel').then(mod => ({ default: mod.OnScreenDebugPanel })), { ssr: false })

const inter = Inter({ subsets: ['latin'] })
const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'Tower Imob - Instrumente Documente & Imobiliare',
  description: 'Dashboard profesional pentru conversie documente, generare anunțuri imobiliare și expansiune imagini cu AI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tower Imob',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/Path 1.png',
    apple: '/Path 1.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#007aff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tower Imob" />
      </head>
              <body className={`${inter.className} ${montserrat.variable} dark`}>
                <ServiceWorkerRegister />
                {children}
                <Toaster />
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <OnScreenDebugPanel />
                  </>
                )}
              </body>
    </html>
  )
}
