import { NextRequest, NextResponse } from 'next/server'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'
const USE_MOCK_DATA = false // Using real REBS API now

// Mock data for development/testing
const mockAgents = [
  {
    id: 1,
    name: 'Maria Popescu',
    email: 'maria.popescu@rebs.ro',
    phone: '+40 722 123 456',
    avatar: 'https://i.pravatar.cc/150?img=1',
    closed_transactions: 28,
    total_value: 3500000,
    active_listings: 12,
    last_transaction_date: '2025-10-05',
  },
  {
    id: 2,
    name: 'Ion Ionescu',
    email: 'ion.ionescu@rebs.ro',
    phone: '+40 722 234 567',
    avatar: 'https://i.pravatar.cc/150?img=12',
    closed_transactions: 25,
    total_value: 3200000,
    active_listings: 8,
    last_transaction_date: '2025-10-04',
  },
  {
    id: 3,
    name: 'Ana Georgescu',
    email: 'ana.georgescu@rebs.ro',
    phone: '+40 722 345 678',
    avatar: 'https://i.pravatar.cc/150?img=5',
    closed_transactions: 22,
    total_value: 2800000,
    active_listings: 15,
    last_transaction_date: '2025-10-03',
  },
  {
    id: 4,
    name: 'Mihai Dumitrescu',
    email: 'mihai.dumitrescu@rebs.ro',
    phone: '+40 722 456 789',
    avatar: 'https://i.pravatar.cc/150?img=13',
    closed_transactions: 19,
    total_value: 2400000,
    active_listings: 10,
    last_transaction_date: '2025-10-02',
  },
  {
    id: 5,
    name: 'Elena Constantinescu',
    email: 'elena.const@rebs.ro',
    phone: '+40 722 567 890',
    avatar: 'https://i.pravatar.cc/150?img=9',
    closed_transactions: 17,
    total_value: 2100000,
    active_listings: 7,
    last_transaction_date: '2025-10-01',
  },
  {
    id: 6,
    name: 'Alexandru Stanciu',
    email: 'alex.stanciu@rebs.ro',
    phone: '+40 722 678 901',
    avatar: 'https://i.pravatar.cc/150?img=14',
    closed_transactions: 15,
    total_value: 1900000,
    active_listings: 9,
    last_transaction_date: '2025-09-30',
  },
  {
    id: 7,
    name: 'Cristina Marin',
    email: 'cristina.marin@rebs.ro',
    phone: '+40 722 789 012',
    avatar: 'https://i.pravatar.cc/150?img=10',
    closed_transactions: 13,
    total_value: 1600000,
    active_listings: 6,
    last_transaction_date: '2025-09-28',
  },
  {
    id: 8,
    name: 'Andrei Popa',
    email: 'andrei.popa@rebs.ro',
    phone: '+40 722 890 123',
    avatar: 'https://i.pravatar.cc/150?img=15',
    closed_transactions: 11,
    total_value: 1400000,
    active_listings: 5,
    last_transaction_date: '2025-09-25',
  },
]

export async function GET(request: NextRequest) {
  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    console.log('Using mock agent data (REBS API endpoints return 404)')
    return NextResponse.json({
      success: true,
      data: mockAgents,
      timestamp: new Date().toISOString(),
      source: 'mock_data'
    })
  }

  try {
    // Try both authentication methods as per REBS documentation
    const methods = [
      // Method 1: API key as GET parameter (recommended)
      {
        url: `${REBS_API_BASE}/agent/?api_key=${REBS_API_KEY}`,
        headers: { 'Content-Type': 'application/json' }
      },
      // Method 2: API key in Authorization header (direct, not Bearer)
      {
        url: `${REBS_API_BASE}/agent/`,
        headers: { 
          'Authorization': REBS_API_KEY,
          'Content-Type': 'application/json'
        }
      },
    ]

    let lastError = null
    
    for (const method of methods) {
      try {
        console.log(`Trying REBS API: ${method.url}`)
        const response = await fetch(method.url, { 
          headers: method.headers,
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Successfully fetched agents from REBS API')
          return NextResponse.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
            source: 'rebs_api'
          })
        }
        
        lastError = `Status ${response.status}: ${response.statusText}`
        console.log(`❌ Failed: ${lastError}`)
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.log(`❌ Error: ${lastError}`)
      }
    }

    // If all methods fail, return mock data as fallback
    console.log('All REBS API methods failed, returning mock data')
    return NextResponse.json({
      success: true,
      data: mockAgents,
      timestamp: new Date().toISOString(),
      source: 'mock_data_fallback',
      error: lastError
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    // Return mock data even on error
    return NextResponse.json({
      success: true,
      data: mockAgents,
      timestamp: new Date().toISOString(),
      source: 'mock_data_error_fallback'
    })
  }
}

