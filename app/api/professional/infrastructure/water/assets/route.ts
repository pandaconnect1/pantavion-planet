import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Created per-request so a missing env var never breaks the build. */
function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const areaCode = searchParams.get('area_code');
    const street = searchParams.get('street');
    const kind = searchParams.get('kind');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'area_code';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('water_network_assets')
      .select('*')
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (areaCode) {
      query = query.eq('area_code', areaCode);
    }

    if (street) {
      query = query.ilike('street', `%${street}%`);
    }

    if (kind) {
      query = query.eq('kind', kind);
    }

    if (search) {
      // Full-text search across multiple columns
      query = query.or(
        `street.ilike.%${search}%,number.ilike.%${search}%,name.ilike.%${search}%`
      );
    }

    // Apply sorting
    if (sortBy === 'street') {
      query = query.order('street', { ascending: true });
    } else if (sortBy === 'number') {
      query = query.order('number', { ascending: true });
    } else {
      query = query.order('area_code', { ascending: true }).order('street', { ascending: true });
    }

    const { data: assets, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Σφάλμα ανάκτησης στοιχείων', details: error.message },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: stats } = await supabase.rpc('count_assets_by_kind');

    return NextResponse.json(
      {
        success: true,
        assets: assets || [],
        count: count || 0,
        limit,
        offset,
        stats: stats || {},
      },
      { status: 200, headers: { 'Cache-Control': 'max-age=300' } }
    );
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή' },
      { status: 500 }
    );
  }
}

// Get asset by ID
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID απαιτείται' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('water_network_assets')
      .update(updates)
      .eq('number', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Σφάλμα ενημέρωσης', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, asset: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Assets PUT error:', error);
    return NextResponse.json(
      { error: 'Σφάλμα διακομιστή' },
      { status: 500 }
    );
  }
}
