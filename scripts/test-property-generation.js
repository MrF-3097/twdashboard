#!/usr/bin/env node

/**
 * Test script for property title and description generation
 * 
 * This script tests the OpenAI integration for generating property titles and descriptions
 * before the payload is sent to REBS API.
 * 
 * Usage:
 *   node scripts/test-property-generation.js
 * 
 * Make sure OPENAI_API_KEY is set in your environment or .env.local file
 */

const testPayload = {
  property: {
    propertyType: 'Apartament',
    transactionMode: 'sale',
    location: {
      street: 'Strada Exemplu',
      streetNumber: '10',
      city: 'București',
      county: 'București'
    },
    characteristics: {
      rooms: '3',
      bathrooms: '2',
      surfaceUseable: '75',
      floor: '5',
      utilities: ['Gaz', 'Curent', 'Apă'],
      dotariImobil: ['Balcon', 'Terasă'],
      parking: ['Loc de parcare'],
      flags: []
    },
    pricing: {
      salePrice: '120000',
      rentPrice: '',
      currency: 'EUR',
      negotiable: false
    },
    media: {
      notes: 'Proprietate frumoasă în centrul orașului'
    }
  },
  contact: {
    firstName: 'Test',
    lastName: 'User',
    cnp: '1234567890123',
    phone: '0712345678'
  }
}

async function testPropertyGeneration() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const testUrl = `${baseUrl}/api/rebs/test-property-generation`

  console.log('🧪 Testing Property Title and Description Generation')
  console.log('=' .repeat(60))
  console.log(`📍 Test URL: ${testUrl}`)
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log('')

  try {
    console.log('📤 Sending test request...')
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    
    console.log('✅ Test completed successfully!')
    console.log('')
    console.log('📊 Test Results:')
    console.log('=' .repeat(60))
    
    // OpenAI Status
    console.log(`\n🤖 OpenAI Status:`)
    console.log(`   Initialized: ${result.testResults.openaiInitialized ? '✅ Yes' : '❌ No'}`)
    
    // Title Generation
    console.log(`\n📝 Title Generation:`)
    if (result.testResults.titleGeneration.success) {
      console.log(`   Status: ✅ Success`)
      console.log(`   Title: "${result.testResults.titleGeneration.title}"`)
    } else {
      console.log(`   Status: ❌ Failed`)
      console.log(`   Error: ${result.testResults.titleGeneration.error}`)
    }
    
    // Description Generation
    console.log(`\n📄 Description Generation:`)
    if (result.testResults.descriptionGeneration.success) {
      console.log(`   Status: ✅ Success`)
      console.log(`   Used Fallback: ${result.testResults.descriptionGeneration.usedFallback ? '⚠️  Yes' : '✅ No'}`)
      console.log(`   Description Length: ${result.testResults.descriptionGeneration.description?.length || 0} characters`)
      console.log(`   Description Preview:`)
      console.log(`   ${'─'.repeat(56)}`)
      const preview = result.testResults.descriptionGeneration.description?.substring(0, 300) || ''
      preview.split('\n').forEach(line => {
        console.log(`   ${line}`)
      })
      if ((result.testResults.descriptionGeneration.description?.length || 0) > 300) {
        console.log(`   ... (truncated)`)
      }
      console.log(`   ${'─'.repeat(56)}`)
    } else {
      console.log(`   Status: ❌ Failed`)
      console.log(`   Error: ${result.testResults.descriptionGeneration.error}`)
      console.log(`   Used Fallback: ${result.testResults.descriptionGeneration.usedFallback ? '⚠️  Yes' : '❌ No'}`)
    }
    
    // Summary
    if (result.testResults.summary) {
      console.log(`\n📋 Property Summary (sent to OpenAI):`)
      console.log(`   ${'─'.repeat(56)}`)
      result.testResults.summary.split('\n').forEach(line => {
        console.log(`   ${line}`)
      })
      console.log(`   ${'─'.repeat(56)}`)
    }
    
    console.log(`\n⏰ Timestamp: ${result.timestamp}`)
    console.log('')
    
    // Final verdict
    const allSuccess = 
      result.testResults.titleGeneration.success &&
      (result.testResults.descriptionGeneration.success || result.testResults.openaiInitialized === false)
    
    if (allSuccess) {
      console.log('🎉 All tests passed!')
      process.exit(0)
    } else {
      console.log('⚠️  Some tests failed. Check the output above for details.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:')
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run the test
testPropertyGeneration()






