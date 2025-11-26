import { NextRequest, NextResponse } from 'next/server'
import { notificationPayloadSchema, sendPushNotification } from '@/lib/push-notification-service'

/**
 * POST /api/notifications/send
 * Send push notification to all subscribed agents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = notificationPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Date invalide pentru notificare.' },
        { status: 400 }
      )
    }

    const { sent, failed } = await sendPushNotification(parsed.data)

    return NextResponse.json({
      success: true,
      message: `Notificare trimisă cu succes la ${sent} agenți.`,
      sent,
      failed,
    })
  } catch (error) {
    console.error('[Send Notification API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Eroare la trimiterea notificării.',
      },
      { status: 500 }
    )
  }
}

