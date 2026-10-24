import { NextRequest, NextResponse } from 'next/server';

interface SyncMessage {
  type: 'update' | 'delete' | 'create';
  sourceMap: 'A' | 'B' | 'D';
  assetNumber: string;
  data: {
    latitude?: number;
    longitude?: number;
    street?: string;
    kind?: string;
    area_code?: string;
    [key: string]: any;
  };
  timestamp: number;
}

// In-memory store for sync events (cleared on server restart)
// For production, use Redis or Supabase real-time channels
const syncEventStore: SyncMessage[] = [];

export async function GET(request: NextRequest) {
  try {
    const sourceMap = request.nextUrl.searchParams.get('sourceMap');
    const since = parseInt(request.nextUrl.searchParams.get('since') || '0');

    if (!sourceMap || !['A', 'B', 'D'].includes(sourceMap)) {
      return NextResponse.json(
        { error: 'Invalid sourceMap parameter' },
        { status: 400 }
      );
    }

    // Return sync events since timestamp
    const events = syncEventStore.filter(
      (e) => e.timestamp > since && e.sourceMap !== sourceMap
    );

    return NextResponse.json(
      { 
        success: true,
        events,
        timestamp: Date.now(),
        count: events.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, sourceMap, assetNumber, data } = body;

    if (!type || !sourceMap || !assetNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: type, sourceMap, assetNumber' },
        { status: 400 }
      );
    }

    const syncMessage: SyncMessage = {
      type: type as 'update' | 'delete' | 'create',
      sourceMap: sourceMap as 'A' | 'B' | 'D',
      assetNumber,
      data,
      timestamp: Date.now(),
    };

    // Store sync event
    syncEventStore.push(syncMessage);
    
    // Keep only last 500 events to avoid memory bloat
    if (syncEventStore.length > 500) {
      syncEventStore.shift();
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Sync event recorded',
        event: syncMessage
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record sync event' },
      { status: 500 }
    );
  }
}
