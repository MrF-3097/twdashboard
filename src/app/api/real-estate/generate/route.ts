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

    // Create the prompt for OpenAI
    const prompt = `
Generate a professional Romanian real estate advertisement with the following requirements:

Property Information:
- Type: ${property.propertyType}
- Location: ${property.location}
- Price: ${property.price}
- Details: ${property.details}

Tone: ${tone}

AI Rules and Instructions:
${aiRules}

Requirements:
1. Write in Romanian language
2. Use a ${tone} tone
3. Follow ALL the AI rules and instructions provided above
4. ALWAYS start the ad with "Tower Imob va prezinta..." (this is mandatory)
5. Include all the provided details naturally in the text
6. Make it persuasive and professional
7. Include a call-to-action for contact
8. Keep it between 100-200 words
9. Format it nicely with line breaks

Generate a compelling real estate ad that will attract potential buyers or renters.
`

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional real estate copywriter for Tower Imob, specializing in Romanian property advertisements. Create compelling, persuasive ads that highlight property features and attract potential buyers or renters. ALWAYS start your ads with 'Tower Imob va prezinta...'"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
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
