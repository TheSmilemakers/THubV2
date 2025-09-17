import { NextRequest, NextResponse } from 'next/server'
import { EODHDService } from '@/lib/services/eodhd.service'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const { symbol } = params
    const { searchParams } = new URL(request.url)
    const interval = searchParams.get('interval') || '5m'
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const eodhd = new EODHDService()
    const data = await eodhd.getIntradayData(symbol, interval as '1m' | '5m' | '1h')
    
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Failed to fetch intraday data', { error })
    
    return NextResponse.json(
      { error: 'Failed to fetch intraday data' },
      { status: 500 }
    )
  }
}
