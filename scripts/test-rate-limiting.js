#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 * Tests that rate limiting works correctly on API routes
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testRateLimit(endpoint, method = 'POST', maxRequests = 5) {
  console.log(`\n🧪 Testing Rate Limiting: ${method} ${endpoint}`)
  console.log(`   Expected limit: ${maxRequests} requests per minute\n`)
  
  const requests = []
  const startTime = Date.now()
  
  // Send requests rapidly (more than the limit)
  for (let i = 0; i < maxRequests + 3; i++) {
    requests.push(
      fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${i}@example.com`,
          password: 'test123'
        }),
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}))
        return {
          status: response.status,
          headers: {
            'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
            'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
            'retry-after': response.headers.get('retry-after'),
          },
          data,
        }
      }).catch(error => ({
        status: 0,
        error: error.message,
      }))
    )
  }
  
  const results = await Promise.all(requests)
  const duration = Date.now() - startTime
  
  // Analyze results
  const successCount = results.filter(r => r.status === 200 || r.status === 401).length
  const rateLimitedCount = results.filter(r => r.status === 429).length
  
  console.log(`   📊 Results:`)
  console.log(`      Total requests: ${results.length}`)
  console.log(`      Successful (200/401): ${successCount}`)
  console.log(`      Rate limited (429): ${rateLimitedCount}`)
  console.log(`      Duration: ${duration}ms`)
  
  if (rateLimitedCount > 0) {
    const firstRateLimited = results.find(r => r.status === 429)
    console.log(`      ✅ Rate limiting working!`)
    console.log(`      Rate limit headers:`, firstRateLimited?.headers)
  } else {
    console.log(`      ⚠️  No rate limiting detected (might need more requests or different endpoint)`)
  }
  
  // Check if rate limit headers are present
  const hasRateLimitHeaders = results.some(r => r.headers?.['x-ratelimit-limit'])
  if (hasRateLimitHeaders) {
    console.log(`      ✅ Rate limit headers present`)
  } else {
    console.log(`      ⚠️  Rate limit headers missing`)
  }
}

async function runTests() {
  console.log('🧪 Rate Limiting Test Suite\n')
  console.log('=' .repeat(50))
  
  // Test login endpoint (5 requests per minute)
  await testRateLimit('/api/auth/login', 'POST', 5)
  
  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Test add-transaction endpoint (30 requests per minute)
  // Note: This might fail with 401/403, but we're testing rate limiting
  console.log(`\n🧪 Testing Rate Limiting: POST /api/admin/add-transaction`)
  console.log(`   Note: This endpoint requires authentication, but rate limiting should work\n`)
  
  const transactionRequests = []
  for (let i = 0; i < 35; i++) {
    transactionRequests.push(
      fetch(`${BASE_URL}/api/admin/add-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Agent: 'Test Agent',
          'Valoare Tranzactie': 1000,
          'Tip Tranzactie': 'Chirie',
          'Comision %': 1,
          Comision: 10,
        }),
      }).then(async (response) => ({
        status: response.status,
        headers: {
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
        },
      })).catch(() => ({ status: 0 }))
    )
  }
  
  const txResults = await Promise.all(transactionRequests)
  const txRateLimited = txResults.filter(r => r.status === 429).length
  
  console.log(`   📊 Results:`)
  console.log(`      Total requests: ${txResults.length}`)
  console.log(`      Rate limited (429): ${txRateLimited}`)
  
  if (txRateLimited > 0) {
    console.log(`      ✅ Rate limiting working on transaction endpoint!`)
  } else {
    console.log(`      ⚠️  No rate limiting detected (might be auth errors instead)`)
  }
  
  console.log('\n✅ Rate limiting tests complete!')
}

// Run tests
runTests().catch(console.error)




















