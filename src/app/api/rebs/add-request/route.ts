import { NextRequest, NextResponse } from 'next/server'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

export const dynamic = 'force-dynamic'

interface AddRequestBody {
  nume: string
  prenume: string
  telefon?: string
  tip_contact?: string
  email?: string
  tip_proprietate?: string
  camere_min?: string
  camere_max?: string
  buget_min?: string
  buget_max?: string
  comentarii_generale?: string
  agent_name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AddRequestBody = await request.json()
    
    const { 
      nume, 
      prenume, 
      telefon, 
      tip_contact, 
      email, 
      tip_proprietate, 
      camere_min, 
      camere_max, 
      buget_min, 
      buget_max, 
      comentarii_generale,
      agent_name 
    } = body

    if (!nume || nume.trim() === '' || !prenume || prenume.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Numele și prenumele sunt obligatorii' },
        { status: 400 }
      )
    }

    // Combine nume and prenume for the name field
    const fullName = `${nume.trim()} ${prenume.trim()}`

    // Build the message from all form fields
    const messageParts: string[] = []
    
    // Add agent info first
    if (agent_name) {
      messageParts.push(`Agent: ${agent_name}`)
    }
    
    // Add contact details
    if (tip_contact) {
      messageParts.push(`Tip Contact: ${tip_contact}`)
    }
    
    // Add property details
    if (tip_proprietate) {
      messageParts.push(`Tip Proprietate: ${tip_proprietate}`)
    }
    if (camere_min || camere_max) {
      const camereRange = camere_min && camere_max 
        ? `${camere_min} - ${camere_max} camere`
        : camere_min 
          ? `Min ${camere_min} camere`
          : `Max ${camere_max} camere`
      messageParts.push(`Camere: ${camereRange}`)
    }
    
    // Add budget details
    if (buget_min || buget_max) {
      const minVal = buget_min ? parseInt(buget_min) : null
      const maxVal = buget_max ? parseInt(buget_max) : null
      
      if (minVal && !isNaN(minVal) && maxVal && !isNaN(maxVal)) {
        messageParts.push(`Buget: €${minVal.toLocaleString()} - €${maxVal.toLocaleString()}`)
      } else if (minVal && !isNaN(minVal)) {
        messageParts.push(`Buget: Min €${minVal.toLocaleString()}`)
      } else if (maxVal && !isNaN(maxVal)) {
        messageParts.push(`Buget: Max €${maxVal.toLocaleString()}`)
      }
    }
    
    // Add general comments (Comentarii Generale) - this is the main message content
    if (comentarii_generale && comentarii_generale.trim()) {
      messageParts.push('')
      messageParts.push('Comentarii Generale:')
      messageParts.push(comentarii_generale.trim())
    }
    
    const message = messageParts.length > 0 
      ? messageParts.join('\n') 
      : `Cerere adăugată din dashboard${agent_name ? ` de către ${agent_name}` : ''}`

    // Prepare the request payload for REBS API
    // REBS API ONLY accepts these 5 fields: name, phone, email, lead_source, message
    // All other form fields (tip_proprietate, camere_min/max, buget_min/max, tip_contact, etc.)
    // are included in the 'message' field above
    const rebsPayload: Record<string, string> = {
      name: fullName,
      message,
      lead_source: 'Dashboard Agent', // Must match an existing lead source in CRM
    }

    // Add optional fields (only if provided)
    if (telefon && telefon.trim()) {
      rebsPayload.phone = telefon.trim()
    }
    if (email && email.trim()) {
      rebsPayload.email = email.trim()
    }

    // Make the POST request to REBS API
    const response = await fetch(`${REBS_API_BASE}/addrequest/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': REBS_API_KEY,
      },
      body: JSON.stringify(rebsPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.error || `HTTP ${response.status}: ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      contact: responseData.contact,
      request: responseData.request,
      message: 'Cererea a fost adăugată cu succes în CRM REBS',
    })

  } catch (error) {
    console.error('Error adding request to REBS:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Eroare necunoscută la adăugarea cererii' 
      },
      { status: 500 }
    )
  }
}

