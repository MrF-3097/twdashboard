import { NextRequest, NextResponse } from 'next/server'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

// Mock data for development/testing - using actual agent IDs from REBS CRM
const mockAgentProperties: Record<number, number> = {
  7836: 12, // Casandra Babă
  7634: 8,  // Simona Pănoiu
  7633: 15, // Sorin Băcilă
  7642: 10, // Ciprian Oprișor
  7640: 7,  // Claudia Achim
  7643: 9,  // Alina Tarita
  9287: 6,  // Cristina Ivanciuc
  7648: 5,  // Cosmin Chirica
  9033: 11, // Francesco Fârțonea
  7814: 13, // Florin Veștemean
  7660: 8,  // Maria Bolovan
  7866: 14, // Ovidiu Neagu
  8787: 7,  // Petru Vidrean
  9145: 9,  // Tudor Veveriță
  7697: 6,  // Sebastian Zeicu
  11428: 10, // Mihaela Butuc
  11641: 12, // Cătălin Nasta
  11852: 8,  // Andrei Fârțonea
  12309: 11, // Marco Roman
  7644: 9,  // Niculina Grindean
}

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId

  try {
    // Fetch all properties from REBS API and filter by agent
    const url = `${REBS_API_BASE}/property/?api_key=${REBS_API_KEY}&limit=1000`
    console.log(`Fetching properties from REBS API for agent ${agentId}: ${url}`)
    
    const response = await fetch(url, { 
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Successfully fetched ${data.objects?.length || 0} properties from REBS API`)
      
      // Filter properties by agent ID
      const agentProperties = data.objects?.filter((property: any) => 
        property.agent?.id === parseInt(agentId)
      ) || []
      
      const propertiesCount = agentProperties.length
      console.log(`Agent ${agentId} has ${propertiesCount} properties`)
      
      return NextResponse.json({
        success: true,
        agentId: parseInt(agentId),
        propertiesCount,
        properties: agentProperties,
        timestamp: new Date().toISOString(),
        source: 'rebs_api'
      })
    }
    
    throw new Error(`Status ${response.status}: ${response.statusText}`)
  } catch (error) {
    console.error(`Error fetching properties for agent ${agentId}:`, error)
    
    // Return mock data as fallback
    const mockCount = mockAgentProperties[parseInt(agentId)] || Math.floor((parseInt(agentId) * 3) % 15) + 3
    console.log(`Using fallback: Agent ${agentId} has ${mockCount} properties (mock data)`)
    
    return NextResponse.json({
      success: true,
      agentId: parseInt(agentId),
      propertiesCount: mockCount,
      properties: [],
      timestamp: new Date().toISOString(),
      source: 'mock_data_fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
