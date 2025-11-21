import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Schema for validating push subscription request
 */
const subscriptionSchema = z.object({
  agentId: z.number(),
  agentName: z.string(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
})

/**
 * POST /api/notifications/subscribe
 * Subscribe an agent to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = subscriptionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Date invalide pentru abonare.' },
        { status: 400 }
      )
    }

    const { agentId, agentName, subscription } = parsed.data

    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1)

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          agentId,
          agentName,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        agentId,
        agentName,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Abonare reușită la notificări!',
    })
  } catch (error) {
    console.error('[Subscribe API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Eroare la abonare.',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribe an agent from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint lipsă.' },
        { status: 400 }
      )
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))

    return NextResponse.json({
      success: true,
      message: 'Dezabonare reușită de la notificări.',
    })
  } catch (error) {
    console.error('[Unsubscribe API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Eroare la dezabonare.',
      },
      { status: 500 }
    )
  }
}

