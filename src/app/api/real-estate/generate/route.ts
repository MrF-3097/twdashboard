import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AdGenerationRequest, AdGenerationResponse } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body: AdGenerationRequest = await request.json()
    const { property, tone, aiRules } = body

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

    // Debug logging
    console.log('OpenAI Response:', completion)
    console.log('Generated adText:', adText)
    console.log('Word count:', wordCount)

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
