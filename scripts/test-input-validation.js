#!/usr/bin/env node

/**
 * Input Validation Test Script
 * Tests that API routes properly validate input and reject invalid data
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testValidation(endpoint, method, validData, invalidDataTests) {
  console.log(`\n🧪 Testing ${method} ${endpoint}`)
  
  // Test 1: Valid data should succeed
  try {
    const validResponse = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validData),
    })
    const validResult = await validResponse.json()
    
    if (validResponse.ok || validResponse.status === 200 || validResponse.status === 201) {
      console.log(`   ✅ Valid data accepted (status: ${validResponse.status})`)
    } else {
      console.log(`   ⚠️  Valid data rejected (status: ${validResponse.status})`)
      console.log(`      Response: ${JSON.stringify(validResult).substring(0, 100)}`)
    }
  } catch (error) {
    console.log(`   ❌ Error testing valid data: ${error.message}`)
  }
  
  // Test 2: Invalid data should be rejected
  for (const test of invalidDataTests) {
    try {
      const invalidResponse = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data),
      })
      const invalidResult = await invalidResponse.json()
      
      if (invalidResponse.status === 400) {
        console.log(`   ✅ Invalid data rejected: "${test.description}" (status: 400)`)
        if (invalidResult.details || invalidResult.error) {
          console.log(`      Error: ${invalidResult.details || invalidResult.error}`)
        }
      } else {
        console.log(`   ❌ Invalid data accepted: "${test.description}" (status: ${invalidResponse.status})`)
        console.log(`      Expected: 400, Got: ${invalidResponse.status}`)
      }
    } catch (error) {
      console.log(`   ❌ Error testing invalid data "${test.description}": ${error.message}`)
    }
  }
}

async function runTests() {
  console.log('🧪 Testing Input Validation on API Routes\n')
  
  // Test 1: Login endpoint
  await testValidation(
    '/api/auth/login',
    'POST',
    { email: 'test@example.com', password: 'test123' },
    [
      { description: 'Missing email', data: { password: 'test123' } },
      { description: 'Missing password', data: { email: 'test@example.com' } },
      { description: 'Invalid email format', data: { email: 'not-an-email', password: 'test123' } },
      { description: 'Empty email', data: { email: '', password: 'test123' } },
    ]
  )
  
  // Test 2: Update target endpoint
  await testValidation(
    '/api/agents/update-target',
    'POST',
    { agentName: 'Test Agent', targetAmount: 50000 },
    [
      { description: 'Missing agentName', data: { targetAmount: 50000 } },
      { description: 'Missing targetAmount', data: { agentName: 'Test Agent' } },
      { description: 'Negative targetAmount', data: { agentName: 'Test Agent', targetAmount: -1000 } },
      { description: 'Zero targetAmount', data: { agentName: 'Test Agent', targetAmount: 0 } },
      { description: 'Empty agentName', data: { agentName: '', targetAmount: 50000 } },
    ]
  )
  
  // Test 3: News likes endpoint
  await testValidation(
    '/api/news/likes',
    'POST',
    { itemId: 'test-123', agentName: 'Test Agent', emoji: '👍', action: 'add' },
    [
      { description: 'Missing itemId', data: { agentName: 'Test Agent', emoji: '👍', action: 'add' } },
      { description: 'Missing agentName', data: { itemId: 'test-123', emoji: '👍', action: 'add' } },
      { description: 'Missing emoji', data: { itemId: 'test-123', agentName: 'Test Agent', action: 'add' } },
      { description: 'Invalid action', data: { itemId: 'test-123', agentName: 'Test Agent', emoji: '👍', action: 'invalid' } },
      { description: 'Empty itemId', data: { itemId: '', agentName: 'Test Agent', emoji: '👍', action: 'add' } },
    ]
  )
  
  // Test 4: Notifications subscribe endpoint
  await testValidation(
    '/api/notifications/subscribe',
    'POST',
    {
      agentId: 1,
      agentName: 'Test Agent',
      subscription: {
        endpoint: 'https://example.com/endpoint',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth',
        },
      },
    },
    [
      { description: 'Missing agentId', data: { agentName: 'Test Agent', subscription: { endpoint: 'https://example.com', keys: { p256dh: 'key', auth: 'auth' } } } },
      { description: 'Missing agentName', data: { agentId: 1, subscription: { endpoint: 'https://example.com', keys: { p256dh: 'key', auth: 'auth' } } } },
      { description: 'Invalid endpoint URL', data: { agentId: 1, agentName: 'Test Agent', subscription: { endpoint: 'not-a-url', keys: { p256dh: 'key', auth: 'auth' } } } },
      { description: 'Missing subscription keys', data: { agentId: 1, agentName: 'Test Agent', subscription: { endpoint: 'https://example.com' } } },
    ]
  )
  
  console.log('\n✅ Input validation testing complete!')
}

// Run tests
runTests().catch(console.error)




















