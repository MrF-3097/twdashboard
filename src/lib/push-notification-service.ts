import { z } from 'zod'
import webpush from 'web-push'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@towerimob.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const normalize = (value: string) => value.trim().toLowerCase()

export const notificationPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().optional(),
  data: z.record(z.any()).optional(),
  excludeAgentId: z.number().optional(),
  targetAgentIds: z.array(z.number()).optional(),
  targetAgentNames: z.array(z.string().min(1)).optional(),
})

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>

export interface PushNotificationResult {
  sent: number
  failed: number
}

/**
 * Sends a push notification to the filtered list of subscriptions.
 */
export const sendPushNotification = async (
  payload: NotificationPayload
): Promise<PushNotificationResult> => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.')
  }

  const parsedPayload = notificationPayloadSchema.parse(payload)

  const subscriptions = await db.select().from(pushSubscriptions)
  if (!subscriptions.length) {
    return { sent: 0, failed: 0 }
  }

  const normalizedTargetNames = parsedPayload.targetAgentNames
    ?.map(normalize)
    .filter(Boolean)

  const hasTargetIds =
    Array.isArray(parsedPayload.targetAgentIds) && parsedPayload.targetAgentIds.length > 0

  const hasTargetNames =
    Array.isArray(normalizedTargetNames) && normalizedTargetNames.length > 0

  const payloadString = JSON.stringify({
    title: parsedPayload.title,
    body: parsedPayload.body,
    icon: parsedPayload.icon || '/icon-192x192.png',
    badge: parsedPayload.badge || '/icon-192x192.png',
    tag: parsedPayload.tag || 'tower-imob-notification',
    requireInteraction: parsedPayload.requireInteraction ?? false,
    data: parsedPayload.data || {},
  })

  let sent = 0
  let failed = 0
  const failedEndpoints: string[] = []

  for (const subscription of subscriptions) {
    if (parsedPayload.excludeAgentId && subscription.agentId === parsedPayload.excludeAgentId) {
      continue
    }

    if (hasTargetIds && !parsedPayload.targetAgentIds!.includes(subscription.agentId)) {
      continue
    }

    if (hasTargetNames && !normalizedTargetNames!.includes(normalize(subscription.agentName))) {
      continue
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payloadString
      )
      sent += 1
    } catch (error) {
      console.error(
        `[PushNotificationService] Failed to send to ${subscription.agentName} (${subscription.endpoint}):`,
        error
      )
      failed += 1
      failedEndpoints.push(subscription.endpoint)
    }
  }

  if (failedEndpoints.length > 0) {
    await Promise.all(
      failedEndpoints.map(async endpoint => {
        try {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
        } catch (cleanupError) {
          console.error('[PushNotificationService] Failed to remove expired subscription:', cleanupError)
        }
      })
    )
  }

  return { sent, failed }
}


