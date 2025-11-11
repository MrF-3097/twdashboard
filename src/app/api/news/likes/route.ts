import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LIKES_FILE_PATH = path.join(process.cwd(), 'data', 'news-likes.json')

interface NewsReaction {
  emoji: string
  agentName: string
}

interface NewsLike {
  itemId: string
  likedBy: string[]
  totalLikes: number
  reactions: NewsReaction[] // Array of { emoji, agentName }
}

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(LIKES_FILE_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read likes from file
function readLikes(): Record<string, NewsLike> {
  ensureDataDirectory()
  if (!fs.existsSync(LIKES_FILE_PATH)) {
    return {}
  }
  try {
    const data = fs.readFileSync(LIKES_FILE_PATH, 'utf-8')
    const likes = JSON.parse(data)
    
    // Migrate old format to new format (backward compatibility)
    Object.keys(likes).forEach(itemId => {
      const item = likes[itemId]
      if (!item.reactions && item.likedBy && Array.isArray(item.likedBy)) {
        // Convert old likedBy array to reactions array
        item.reactions = item.likedBy.map((agentName: string) => ({
          emoji: '❤️', // Default to heart for old likes
          agentName
        }))
        // Keep likedBy for backward compatibility
      } else if (!item.reactions) {
        item.reactions = []
      }
    })
    
    return likes
  } catch (error) {
    console.error('Error reading likes file:', error)
    return {}
  }
}

// Write likes to file
function writeLikes(likes: Record<string, NewsLike>) {
  ensureDataDirectory()
  try {
    fs.writeFileSync(LIKES_FILE_PATH, JSON.stringify(likes, null, 2))
  } catch (error) {
    console.error('Error writing likes file:', error)
  }
}

// GET - Fetch all likes
export async function GET() {
  try {
    const likes = readLikes()
    
    // Check if migration is needed and save migrated data
    let needsSave = false
    Object.keys(likes).forEach(itemId => {
      const item = likes[itemId]
      if (!item.reactions && item.likedBy && Array.isArray(item.likedBy)) {
        // Convert old likedBy array to reactions array
        item.reactions = item.likedBy.map((agentName: string) => ({
          emoji: '❤️', // Default to heart for old likes
          agentName
        }))
        needsSave = true
      } else if (!item.reactions) {
        item.reactions = []
        needsSave = true
      }
    })
    
    // Save migrated data if needed
    if (needsSave) {
      writeLikes(likes)
    }
    
    return NextResponse.json({ success: true, data: likes })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Update reaction for a news item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, agentName, emoji, action } = body 
    // action: 'add' or 'remove'
    // emoji: emoji string (e.g., '👍', '❤️', '😂', etc.)

    if (!itemId || !agentName || !emoji || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const likes = readLikes()
    
    if (!likes[itemId]) {
      likes[itemId] = {
        itemId,
        likedBy: [],
        totalLikes: 0,
        reactions: []
      }
    }

    const newsLike = likes[itemId]
    if (!newsLike.reactions) {
      newsLike.reactions = []
    }

    // Find existing reaction from this agent
    const existingReactionIndex = newsLike.reactions.findIndex(
      r => r.agentName === agentName
    )

    if (action === 'add') {
      // Remove existing reaction from this agent if any
      if (existingReactionIndex >= 0) {
        newsLike.reactions.splice(existingReactionIndex, 1)
      }
      // Add new reaction
      newsLike.reactions.push({ emoji, agentName })
    } else if (action === 'remove') {
      // Remove reaction
      if (existingReactionIndex >= 0) {
        newsLike.reactions.splice(existingReactionIndex, 1)
      }
    }

    // Update total likes (for backward compatibility)
    newsLike.totalLikes = newsLike.reactions.length
    newsLike.likedBy = newsLike.reactions.map(r => r.agentName)

    writeLikes(likes)

    // Count reactions by emoji
    const reactionCounts: Record<string, number> = {}
    newsLike.reactions.forEach(r => {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        itemId,
        reactions: newsLike.reactions,
        reactionCounts,
        totalReactions: newsLike.reactions.length
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}


