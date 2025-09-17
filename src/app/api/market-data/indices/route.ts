import { NextRequest, NextResponse } from 'next/server'
import { EODHDService } from '@/lib/services/eodhd.service'
import { logger } from '@/lib/logger'

const MAJOR_INDICES = [
  { symbol: 'GSPC.INDX', name: 'S&P 500' },
  { symbol: 'DJI.INDX', name: 'Dow Jones' },
  { symbol: 'IXIC.INDX', name: 'NASDAQ' },
  { symbol: 'RUT.INDX', name: 'Russell 2000' }
]

export async function GET(request: NextRequest) {
  try {
    const eodhd = new EODHDService()
    
    const indices = await Promise.all(
      MAJOR_INDICES.map(async (index) => {
        try {
          const [quote, intradayData] = await Promise.all([
            eodhd.getRealTimeQuote(index.symbol),
            eodhd.getIntradayData(index.symbol, '5m').catch(() => [])
          ])

          return {
            symbol: index.symbol,
            name: index.name,
            price: Number(quote.close) || 0,
            change: Number(quote.change) || 0,
            changePercent: Number(quote.change_p) || 0,
            isUp: Number(quote.change) >= 0,
            data: intradayData.slice(-20) // Last 20 data points for sparkline
          }
        } catch (error) {
          logger.error(`Failed to fetch data for ${index.symbol}`, { error })
          return null
        }
      })
    )
    
    // Filter out failed fetches
    const validIndices = indices.filter(Boolean)
    
    return NextResponse.json(validIndices)
  } catch (error) {
    logger.error('Failed to fetch market indices', { error })
    
    return NextResponse.json(
      { error: 'Failed to fetch market indices' },
      { status: 500 }
    )
  }
}