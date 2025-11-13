import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Read the service worker file from public directory
    const swPath = join(process.cwd(), 'public', 'sw.js')
    const swContent = readFileSync(swPath, 'utf-8')
    
    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    })
  } catch (error) {
    console.error('[SW Route] Error serving service worker:', error)
    return new NextResponse('Service Worker not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}



