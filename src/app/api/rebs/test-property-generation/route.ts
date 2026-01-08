import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Test endpoint to verify OpenAI title and description generation
 * This endpoint tests the same logic used in the property POST endpoint
 * without actually creating a property in REBS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    logger.info('[Test Property Generation] Received test request', {
      hasProperty: !!body.property,
      hasContact: !!body.contact
    })

    // Check OpenAI initialization
    const openai =
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
        ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        : null

    const testResults: {
      openaiInitialized: boolean
      titleGeneration: {
        success: boolean
        title?: string
        error?: string
      }
      descriptionGeneration: {
        success: boolean
        description?: string
        error?: string
        usedFallback?: boolean
      }
      summary?: string
    } = {
      openaiInitialized: !!openai,
      titleGeneration: { success: false },
      descriptionGeneration: { success: false }
    }

    // Test title generation
    try {
      const property = body.property || {}
      const transactionMode = property.transactionMode || 'sale'
      const propertyType = property.propertyType || 'Apartament'
      const rooms = property.characteristics?.rooms || ''
      const salePrice = property.pricing?.salePrice || ''
      const rentPrice = property.pricing?.rentPrice || ''
      const currency = property.pricing?.currency || 'EUR'

      const forSale = transactionMode === 'sale' || transactionMode === 'both'
      const forRent = transactionMode === 'rent' || transactionMode === 'both'
      const modeLabel =
        forSale && forRent ? 'de vânzare & de închiriat' : forSale ? 'de vânzare' : 'de închiriat'

      const parseInteger = (value?: string): number | undefined => {
        if (!value) return undefined
        const match = value.match(/-?\d+/)
        if (!match) return undefined
        const num = Number(match[0])
        return Number.isFinite(num) ? num : undefined
      }

      const parseNumeric = (value?: string): number | undefined => {
        if (!value) return undefined
        const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
        const num = Number(normalized)
        return Number.isFinite(num) ? num : undefined
      }

      const formatCurrency = (value?: number, curr: 'EUR' | 'RON' = 'EUR') => {
        if (!value || !Number.isFinite(value)) return null
        try {
          return new Intl.NumberFormat('ro-RO', {
            style: 'currency',
            currency: curr,
            maximumFractionDigits: 0,
          }).format(value)
        } catch {
          return `${value} ${curr === 'RON' ? 'RON' : '€'}`
        }
      }

      const roomsValue = parseInteger(rooms)
      const roomsLabel = roomsValue ? `${roomsValue} camere` : ''

      const salePriceNum = parseNumeric(salePrice)
      const rentPriceNum = parseNumeric(rentPrice)
      const priceLabel =
        (forSale && salePriceNum && formatCurrency(salePriceNum, currency)) ||
        (forRent && rentPriceNum && formatCurrency(rentPriceNum, currency)) ||
        ''

      const title = [
        propertyType,
        modeLabel,
        roomsLabel && `${roomsLabel}`,
        priceLabel && `| ${priceLabel}`,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      testResults.titleGeneration = {
        success: true,
        title
      }

      logger.info('[Test Property Generation] Title generated successfully', { title })
    } catch (error) {
      logger.error('[Test Property Generation] Title generation failed', error)
      testResults.titleGeneration = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test description generation
    try {
      if (!openai) {
        testResults.descriptionGeneration = {
          success: false,
          error: 'OpenAI client not initialized - OPENAI_API_KEY missing or empty',
          usedFallback: true
        }
        logger.warn('[Test Property Generation] OpenAI not available, skipping description test')
      } else {
        // Build summary similar to buildDescriptionSummary
        const property = body.property || {}
        const location = property.location || {}
        const pricing = property.pricing || {}
        const characteristics = property.characteristics || {}

        const locationParts = [location.city, location.street]
          .filter(Boolean)
          .join(', ')

        const parseNumeric = (value?: string): number | undefined => {
          if (!value) return undefined
          const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
          const num = Number(normalized)
          return Number.isFinite(num) ? num : undefined
        }

        const formatCurrency = (value?: number, curr: 'EUR' | 'RON' = 'EUR') => {
          if (!value || !Number.isFinite(value)) return null
          try {
            return new Intl.NumberFormat('ro-RO', {
              style: 'currency',
              currency: curr,
              maximumFractionDigits: 0,
            }).format(value)
          } catch {
            return `${value} ${curr === 'RON' ? 'RON' : '€'}`
          }
        }

        const priceSummary = [
          parseNumeric(pricing.salePrice) &&
            `Preț vânzare: ${formatCurrency(
              parseNumeric(pricing.salePrice),
              pricing.currency || 'EUR'
            )}`,
          parseNumeric(pricing.rentPrice) &&
            `Preț închiriere: ${formatCurrency(
              parseNumeric(pricing.rentPrice),
              pricing.currency || 'EUR'
            )}/lună`,
        ]
          .filter(Boolean)
          .join(' | ')

        const features = [
          characteristics.rooms && `${characteristics.rooms} camere`,
          characteristics.bathrooms && `${characteristics.bathrooms} băi`,
          characteristics.surfaceUseable && `${characteristics.surfaceUseable} mp utili`,
          characteristics.floor && `Etaj: ${characteristics.floor}`,
        ]
          .filter(Boolean)
          .join(', ')

        const amenities = [
          ...(characteristics.utilities || []),
          ...(characteristics.dotariImobil || []),
          ...(characteristics.parking || []),
          ...(characteristics.otherSpaces || []),
        ].join(', ')

        const summary = [
          `Tip proprietate: ${property.propertyType || 'Apartament'}`,
          `Transacție: ${property.transactionMode || 'sale'}`,
          locationParts && `Localizare: ${locationParts}`,
          features && `Caracteristici: ${features}`,
          (characteristics.flags || []).length > 0 &&
            `Notă: ${(characteristics.flags || []).join(', ')}`,
          priceSummary,
          amenities && `Dotări: ${amenities}`,
        ]
          .filter(Boolean)
          .join('\n')

        testResults.summary = summary

        logger.info('[Test Property Generation] Calling OpenAI API', {
          summaryLength: summary.length
        })

        const startTime = Date.now()
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Ești copywriter pentru Tower Imob. Scrie descrieri concise, profesioniste și atrăgătoare, în limba română, max 160 de cuvinte. Include avantajele principale și îndeamnă clientul să programeze o vizionare.',
            },
            {
              role: 'user',
              content: `Folosește următoarele date despre proprietate pentru a scrie descrierea:\n${summary}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.6,
        })

        const duration = Date.now() - startTime
        logger.info('[Test Property Generation] OpenAI API call completed', {
          duration: `${duration}ms`,
          usage: completion.usage,
          choicesCount: completion.choices?.length || 0
        })

        const text = completion.choices[0]?.message?.content?.trim()

        if (!text || text.length === 0) {
          logger.warn('[Test Property Generation] OpenAI returned empty description')
          testResults.descriptionGeneration = {
            success: false,
            error: 'OpenAI returned empty description',
            usedFallback: true
          }
        } else {
          testResults.descriptionGeneration = {
            success: true,
            description: text,
            usedFallback: false
          }
          logger.info('[Test Property Generation] Description generated successfully', {
            descriptionLength: text.length
          })
        }
      }
    } catch (error) {
      logger.error('[Test Property Generation] Description generation failed', error)
      testResults.descriptionGeneration = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        usedFallback: true
      }
    }

    return NextResponse.json({
      success: true,
      testResults,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('[Test Property Generation] Test endpoint error', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}






