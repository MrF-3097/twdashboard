import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AdGenerationRequest, AdGenerationResponse } from '@/types'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({ apiKey })
}

// Token pricing: GPT-4o-mini costs $0.15 per 1M input tokens and $0.60 per 1M output tokens
// For simplicity, we'll use average cost: ~$0.30 per 1M tokens (mixed input/output)
// 1 RON ≈ 0.20 USD (approximate), so 1M tokens ≈ 1.5 RON
const TOKEN_COST_PER_MILLION = 1.5 // RON

function getTokenUsageFilePath() {
  return path.join(process.cwd(), 'data', 'token-usage.json')
}

function readTokenUsage() {
  try {
    const filePath = getTokenUsageFilePath()
    if (!fs.existsSync(filePath)) {
      return []
    }
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data || '[]')
  } catch (error) {
    console.error('Error reading token usage:', error)
    return []
  }
}

function writeTokenUsage(data: any[]) {
  try {
    const filePath = getTokenUsageFilePath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing token usage:', error)
  }
}

function recordTokenUsage(agentId: number, agentName: string, tokensUsed: number, costInRON: number) {
  const usage = readTokenUsage()
  const timestamp = new Date().toISOString()
  
  usage.push({
    agentId,
    agentName,
    tokensUsed,
    costInRON,
    timestamp
  })
  
  writeTokenUsage(usage)
}

export async function POST(request: NextRequest) {
  try {
    const body: AdGenerationRequest & { agentId?: number; agentName?: string } = await request.json()
    const { property, tone, aiRules, agentId, agentName } = body

    // Validate required fields
    if (!property.location || !property.price || !property.details) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create tone-specific system prompts
    const toneSystemPrompts = {
      professional: `You are a highly professional real estate copywriter for Tower Imob. Your writing is:
- Formal and business-oriented
- Factual and precise with details
- Emphasizes investment value and ROI
- Uses industry terminology appropriately
- Structured and well-organized
- Highlights measurable features (sq meters, number of rooms, exact amenities)
- Appeals to serious investors and buyers
- Maintains professional distance while being informative
ALWAYS start with "Tower Imob va prezinta..."`,

      persuasive: `You are a persuasive real estate copywriter for Tower Imob. Your writing is:
- Emotionally engaging and compelling
- Creates urgency and FOMO (fear of missing out)
- Highlights unique selling points and exclusivity
- Uses powerful adjectives: "excepțional", "rar", "unic", "oportunitate de neratat"
- Paints a vivid picture of lifestyle benefits
- Emphasizes scarcity and demand ("ultim apartament disponibil", "ofertă limitată")
- Tells a story that makes readers imagine living there
- Strong call-to-action that motivates immediate contact
ALWAYS start with "Tower Imob va prezinta..."`,

      friendly: `You are a warm, friendly real estate copywriter for Tower Imob. Your writing is:
- Conversational and approachable (like talking to a friend)
- Uses familiar language and personal touches
- Warm and welcoming tone
- Tells a relatable story about the property
- Focuses on comfort, home, and lifestyle
- Uses phrases like "vă așteaptă", "veți adora", "visul dumneavoastră"
- Creates an emotional connection
- Inviting and enthusiastic without being pushy
- Makes readers feel excited about viewing the property
ALWAYS start with "Tower Imob va prezinta..."`
    };

    // Create tone-specific writing guidelines
    const toneGuidelines = {
      professional: `
- Use formal language and complete sentences
- Focus on: square meters, exact specifications, ROI potential, location advantages
- Mention: nearby infrastructure, transportation, investment value appreciation
- Structure: Start with key facts, then detailed features, end with investment potential
- Example phrases: "investiție excelentă", "potențial ridicat de apreciere", "locație premium"`,

      persuasive: `
- Create urgency with phrases like: "oportunitate rară", "nu ratați", "disponibil pentru scurt timp"
- Use superlatives: "excepțional", "spectaculos", "incomparabil", "de neuitat"
- Emphasize uniqueness: "singura proprietate de acest tip", "ofertă exclusivă"
- Paint lifestyle: "imaginați-vă dimineți însorite pe terasa dvs.", "simțiți confortul"
- Strong CTA: "Contactați-ne astăzi", "Programați o vizionare urgentă"
- Show competition: "cerere mare", "interes crescut"`,

      friendly: `
- Write like talking to a friend over coffee
- Use warm expressions: "Bună!", "vă invităm", "cu drag"
- Tell a story: Describe a typical day living there
- Personal touches: "veți simți imediat căldura casei", "un loc unde veți crea amintiri"
- Enthusiastic but genuine: "nu putem să nu vă arătăm", "trebuie să vedeți"
- Conversational CTA: "Hai să vă arătăm!", "Ne-ar plăcea să vă cunoaștem"
- Friendly closing: "Vă așteptăm cu nerăbdare!"`
    };

    // Create the tone-specific prompt
    const prompt = `
Generate a Romanian real estate advertisement with the following:

Property Information:
- Type: ${property.propertyType}
- Location: ${property.location}
- Price: ${property.price}
- Details: ${property.details}

TONE: ${tone.toUpperCase()}
${toneGuidelines[tone]}

AI Rules and Instructions:
${aiRules}

Requirements:
1. Write in Romanian language
2. Use DISTINCTLY ${tone.toUpperCase()} tone - make it very different from other tones
3. Follow ALL the AI rules and instructions provided above
4. MANDATORY: Start with "Tower Imob va prezinta..."
5. Include all provided details naturally
6. Keep it between 100-200 words
7. Format with line breaks for readability

Generate the ad now using a DISTINCTLY ${tone} voice.
`

      // Call OpenAI API with tone-specific system prompt
      const openai = getOpenAIClient()
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: toneSystemPrompts[tone]
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: tone === 'friendly' ? 0.8 : tone === 'persuasive' ? 0.75 : 0.6,
      })

    const adText = completion.choices[0]?.message?.content || ''
    const wordCount = adText.split(' ').length

    // Track token usage
    const tokensUsed = completion.usage?.total_tokens || 0
    const costInRON = (tokensUsed / 1_000_000) * TOKEN_COST_PER_MILLION
    
    if (agentId && agentName) {
      recordTokenUsage(agentId, agentName, tokensUsed, costInRON)
    }

    // Debug logging
    console.log('OpenAI Response:', completion)
    console.log('Generated adText:', adText)
    console.log('Word count:', wordCount)
    console.log('Tokens used:', tokensUsed, 'Cost (RON):', costInRON.toFixed(4))

    const response: AdGenerationResponse = {
      id: Date.now().toString(),
      adText,
      wordCount,
      generatedAt: new Date()
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error generating ad:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate ad. Please try again.' 
      },
      { status: 500 }
    )
  }
}
