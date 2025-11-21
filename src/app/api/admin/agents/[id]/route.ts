import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateDashboardAgent } from '@/lib/dashboard-agents-store'

const updateAgentSchema = z
  .object({
    password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere.').optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.password || data.isActive !== undefined, {
    message: 'Trebuie să specifici o parolă nouă sau starea contului.',
  })

type RouteContext = {
  params: { id: string }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const agentId = Number(context.params.id)

    if (Number.isNaN(agentId)) {
      return NextResponse.json(
        { success: false, error: 'ID agent invalid.' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const parsed = updateAgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Date invalide.' },
        { status: 400 },
      )
    }

    const updatedAgent = await updateDashboardAgent(agentId, {
      password: parsed.data.password,
      isActive: parsed.data.isActive,
    })

    return NextResponse.json({ success: true, data: updatedAgent })
  } catch (error) {
    console.error('Error updating dashboard agent:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Nu am putut actualiza agentul.',
      },
      { status: 500 },
    )
  }
}
