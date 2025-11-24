import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import webpush from 'web-push'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Configure web-push with VAPID keys
 * In production, these should be in environment variables
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@towerimob.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

/**
 * Schema for validating notification send request
 */
const notificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().optional(),
  data: z.record(z.any()).optional(),
  excludeAgentId: z.number().optional(), // Don't send to this agent (e.g., the one who caused the change)
  targetAgentIds: z.array(z.number()).optional(),
  targetAgentNames: z.array(z.string().min(1)).optional(),
})

/**
 * POST /api/notifications/send
 * Send push notification to all subscribed agents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = notificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Date invalide pentru notificare.' },
        { status: 400 }
      )
    }

    const notificationData = parsed.data

    // Get all active subscriptions
    const subscriptions = await db.select().from(pushSubscriptions)

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nicio abonare activă găsită.',
        sent: 0,
        failed: 0,
      })
    }

    const payload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.body,
      icon: notificationData.icon || '/icon-192x192.png',
      badge: notificationData.badge || '/icon-192x192.png',
      tag: notificationData.tag || 'tower-imob-notification',
      requireInteraction: notificationData.requireInteraction || false,
      data: notificationData.data || {},
    })

    let sent = 0
    let failed = 0
    const failedEndpoints: string[] = []

    const normalizedTargetAgentNames = notificationData.targetAgentNames
      ?.map(name => name.trim().toLowerCase())
      .filter(name => name.length > 0)

    const hasTargetIds =
      Array.isArray(notificationData.targetAgentIds) &&
      notificationData.targetAgentIds.length > 0

    const hasTargetNames =
      Array.isArray(normalizedTargetAgentNames) &&
      normalizedTargetAgentNames.length > 0

    // Send to all subscriptions
    for (const sub of subscriptions) {
      // Skip if this is the agent who caused the change
      if (notificationData.excludeAgentId && sub.agentId === notificationData.excludeAgentId) {
        continue
      }

      // Limit to targeted agent IDs if provided
      if (hasTargetIds && !notificationData.targetAgentIds!.includes(sub.agentId)) {
        continue
      }

      if (hasTargetNames) {
        const normalizedName = sub.agentName.trim().toLowerCase()
        if (!normalizedTargetAgentNames!.includes(normalizedName)) {
          continue
        }
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
        sent++
      } catch (error) {
        console.error(`[Send Notification] Failed to send to ${sub.agentName}:`, error)
        failed++
        failedEndpoints.push(sub.endpoint)
      }
    }

    // Clean up failed subscriptions (they might be expired)
    if (failedEndpoints.length > 0) {
      for (const endpoint of failedEndpoints) {
        try {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
        } catch (error) {
          console.error('[Send Notification] Failed to delete expired subscription:', error)
        }
      }
    }

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

