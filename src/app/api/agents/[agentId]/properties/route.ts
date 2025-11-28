import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch } from '@/lib/rebs-client'

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
    // Fetch properties from new REBS API filtered by agent ID
    const queryParams = new URLSearchParams({
      agents: agentId, // Filter by agent ID
      page_size: '1000', // Get up to 1000 properties
      ordering: '-date_added',
    })
    
    console.log(`Fetching properties from new REBS API for agent ${agentId}`)
    
    const response = await rebsFetch(`/properties/?${queryParams.toString()}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`HTTP ${response.status}: ${body}`)
    }
    
    const data = await response.json()
    
    // New API returns results array (or objects for backward compatibility)
    const properties = Array.isArray(data) 
      ? data 
      : Array.isArray(data?.results) 
        ? data.results 
        : Array.isArray(data?.objects) 
          ? data.objects 
          : []
    
    // Filter active properties and ensure they match the agent
    const agentProperties = properties.filter((property: any) => {
      const propertyAgentId = property.agent?.id ?? property.agent
      const matchesAgent = propertyAgentId === parseInt(agentId)
      const isActive = property.availability === 1 || property.active === true || property.availability === '1'
      return matchesAgent && isActive
    })
    
    const propertiesCount = agentProperties.length
    console.log(`✅ Agent ${agentId} has ${propertiesCount} active properties`)
    
    return NextResponse.json({
      success: true,
      agentId: parseInt(agentId),
      propertiesCount,
      properties: agentProperties,
      timestamp: new Date().toISOString(),
      source: 'rebs_api'
    })
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
