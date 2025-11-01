import { NextRequest, NextResponse } from 'next/server'

const GAS_BASE_URL = 'https://script.google.com/macros/s/AKfycbxjKUEhxDobALZhfvpqS3tuI5AcMaRQuDJfZWHsPWLtgvOoj5aXR9GPUpkY2PqntOfI/exec'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentName } = body

    if (!agentName || typeof agentName !== 'string' || agentName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent name is required' },
        { status: 400 }
      )
    }

    // Send to Google Apps Script endpoint using GET
    const url = new URL(GAS_BASE_URL)
    url.searchParams.set('route', 'add_agent')
    url.searchParams.set('agent', agentName.trim())

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GAS error:', errorText.substring(0, 200))
      throw new Error(`Failed to add agent: ${response.status}`)
    }

    const result = await response.text()
    
    // GAS might return HTML if route not implemented, or JSON if successful
    let jsonResult
    try {
      jsonResult = JSON.parse(result)
    } catch {
      console.warn('GAS returned non-JSON response - route might not be implemented')
      return NextResponse.json({
        success: false,
        error: 'Google Apps Script write endpoint not yet implemented. Please add route=add_agent handler.',
      })
    }

    // Check if GAS returned an error
    if (jsonResult.error) {
      console.error('❌ [API] GAS returned error:', jsonResult.error)
      return NextResponse.json({
        success: false,
        error: `Google Apps Script error: ${jsonResult.error}`,
      })
    }

    return NextResponse.json({
      success: true,
      data: jsonResult,
      message: 'Agent added successfully',
    })

  } catch (error) {
    console.error('Error adding agent:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add agent',
      },
      { status: 500 }
    )
  }
}

