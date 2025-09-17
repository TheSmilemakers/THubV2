import { NextRequest, NextResponse } from 'next/server'
import { EODHDService } from '@/lib/services/eodhd.service'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const { symbol } = params
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const eodhd = new EODHDService()
    const quote = await eodhd.getRealTimeQuote(symbol)
    
    return NextResponse.json(quote)
  } catch (error) {
    logger.error('Failed to fetch real-time quote', { error })
    
    return NextResponse.json(
      { error: 'Failed to fetch quote data' },
      { status: 500 }
    )
  }
}
