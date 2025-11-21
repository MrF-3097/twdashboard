/**
 * Generate VAPID keys for Web Push notifications
 * Run this script once and add the keys to your .env file
 * 
 * Usage: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n🔑 VAPID Keys Generated Successfully!\n')
console.log('Add these to your .env.local file:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:admin@towerimob.com\n`)
console.log('⚠️  Keep the PRIVATE key secret! Never commit it to version control.\n')

