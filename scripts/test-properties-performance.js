#!/usr/bin/env node

/**
 * Performance Test Script for Properties API
 * Tests parallel fetching vs sequential, cache performance
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testPropertiesAPI() {
  console.log('🧪 Testing Properties API Performance\n')
  
  // Test 1: First request (cache miss)
  console.log('📊 Test 1: First request (cache miss)')
  const start1 = Date.now()
  try {
    const response1 = await fetch(`${BASE_URL}/api/properties`)
    const data1 = await response1.json()
    const duration1 = Date.now() - start1
    
    console.log(`   ✅ Status: ${response1.status}`)
    console.log(`   ⏱️  Duration: ${duration1}ms`)
    console.log(`   📦 Properties: ${data1.data?.objects?.length || 0}`)
    console.log(`   💾 Cached: ${data1._performance?.cached ? 'Yes' : 'No'}`)
    console.log(`   🎯 Performance: ${duration1 < 5000 ? '✅ Excellent' : duration1 < 10000 ? '⚠️  Good' : '❌ Needs improvement'}\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
    return
  }
  
  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Test 2: Second request (cache hit)
  console.log('📊 Test 2: Second request (cache hit - should be instant)')
  const start2 = Date.now()
  try {
    const response2 = await fetch(`${BASE_URL}/api/properties`)
    const data2 = await response2.json()
    const duration2 = Date.now() - start2
    
    console.log(`   ✅ Status: ${response2.status}`)
    console.log(`   ⏱️  Duration: ${duration2}ms`)
    console.log(`   📦 Properties: ${data2.data?.objects?.length || 0}`)
    console.log(`   💾 Cached: ${data2._performance?.cached ? 'Yes' : 'No'}`)
    
    if (data2._performance?.cached) {
      const speedup = duration1 > 0 ? ((duration1 - duration2) / duration1 * 100).toFixed(1) : '0'
      console.log(`   🚀 Speedup: ${speedup}% faster`)
      console.log(`   🎯 Performance: ${duration2 < 100 ? '✅ Excellent (cached)' : duration2 < 500 ? '⚠️  Good (cached)' : '❌ Slow (cached)'}\n`)
    } else {
      console.log(`   ⚠️  Cache not working as expected\n`)
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
  }
  
  // Test 3: Multiple concurrent requests
  console.log('📊 Test 3: Multiple concurrent requests (stress test)')
  const concurrentRequests = 5
  const start3 = Date.now()
  try {
    const promises = Array.from({ length: concurrentRequests }, () => 
      fetch(`${BASE_URL}/api/properties`)
    )
    const responses = await Promise.all(promises)
    const duration3 = Date.now() - start3
    
    const allSuccess = responses.every(r => r.ok)
    console.log(`   ✅ All successful: ${allSuccess ? 'Yes' : 'No'}`)
    console.log(`   ⏱️  Total duration: ${duration3}ms`)
    console.log(`   📊 Avg per request: ${(duration3 / concurrentRequests).toFixed(0)}ms`)
    console.log(`   🎯 Performance: ${duration3 < 2000 ? '✅ Excellent' : duration3 < 5000 ? '⚠️  Good' : '❌ Needs improvement'}\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
  }
  
  console.log('✅ Performance testing complete!')
}

// Run tests
testPropertiesAPI().catch(console.error)

