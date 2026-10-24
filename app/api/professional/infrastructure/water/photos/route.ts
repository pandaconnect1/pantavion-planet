import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface PhotoUploadRequest {
  faultId: string;
  base64Data: string;
  fileName: string;
  mimeType: string;
  photoType: 'damage' | 'excavation' | 'before' | 'after' | 'other';
  metadata?: {
    latitude?: number;
    longitude?: number;
    excavationWidth?: number;
    excavationLength?: number;
    excavationDepth?: number;
    soilType?: string;
    notes?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PhotoUploadRequest = await request.json();
    const {
      faultId,
      base64Data,
      fileName,
      mimeType,
      photoType,
      metadata,
    } = body;

    if (!faultId || !base64Data || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: faultId, base64Data, fileName' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `faults/${faultId}/${Date.now()}-${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('water-fault-media')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('water-fault-media').getPublicUrl(filePath);

    // Record in database
    const { data: photoRecord, error: dbError } = await supabase
      .from('water_fault_photos')
      .insert({
        fault_id: faultId,
        url: publicUrl,
        type: photoType,
        file_name: fileName,
        mime_type: mimeType,
        file_size: buffer.length,
        metadata: metadata || {},
        uploaded_at: new Date(),
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from('water-fault-media').remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to record photo in database', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        photo: photoRecord,
        url: publicUrl,
        fileSize: buffer.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process photo upload' },
      { status: 500 }
    );
  }
}

// GET photos for a fault
export async function GET(request: NextRequest) {
  try {
    const faultId = request.nextUrl.searchParams.get('faultId');

    if (!faultId) {
      return NextResponse.json(
        { error: 'faultId parameter required' },
        { status: 400 }
      );
    }

    const { data: photos, error } = await supabase
      .from('water_fault_photos')
      .select('*')
      .eq('fault_id', faultId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch photos', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, photos: photos || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photo fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// DELETE a photo
export async function DELETE(request: NextRequest) {
  try {
    const photoId = request.nextUrl.searchParams.get('photoId');
    const filePath = request.nextUrl.searchParams.get('filePath');

    if (!photoId || !filePath) {
      return NextResponse.json(
        { error: 'photoId and filePath parameters required' },
        { status: 400 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('water-fault-media')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion warning:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('water_fault_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to delete photo', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Photo deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photo deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
