import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { processImage } from '@/lib/image-pipeline';
import { uploadProcessedImage } from '@/lib/storage';
import type { ImageRecord } from '@/types/image';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

async function getAuthenticatedUser(request: Request) {
    const authHeader = request.headers.get('authorization');
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Unauthorized' };
    }
  
    const token = authHeader.replace('Bearer ', '').trim();
  
    if (!token) {
      return { user: null, error: 'Unauthorized' };
    }
  
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
  
    if (error || !user) {
      return { user: null, error: 'Unauthorized' };
    }
  
    return { user, error: null };
}

export async function GET(request: Request) {
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
        return fail('Unauthorized', 401);
    }
    const { data, error } = await supabaseAdmin
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('GET /api/images failed:', error);
        return fail('Failed to fetch images', 500);
    }
    return ok(data as ImageRecord[]);
}

export async function POST(request: Request) {
    const { user, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user) {
      return fail('Unauthorized', 401);
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
        return fail('File is required', 400);
        }

        if (!allowedMimeTypes.includes(file.type)) {
        return fail('Unsupported file type', 400);
        }

        if (file.size > MAX_FILE_SIZE) {
        return fail('File too large (max 10MB)', 400);
        }

        const { data: createdRow, error: createError } = await supabaseAdmin
        .from('images')
        .insert({
            user_id: user.id,
            original_filename: file.name,
            status: 'processing',
        })
        .select('*')
        .single();

        if (createError || !createdRow) {
        console.error('Create image row failed:', createError);
        return fail('Failed to create image record', 500);
        }

        try {
        const inputBuffer = Buffer.from(await file.arrayBuffer());
        const processedBuffer = await processImage(inputBuffer);
        const { storagePath, publicUrl } = await uploadProcessedImage(processedBuffer);

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('images')
            .update({
            status: 'ready',
            processed_url: publicUrl,
            storage_path: storagePath,
            error_message: null,
            })
            .eq('id', createdRow.id)
            .eq('user_id', user.id)
            .select('*')
            .single();

        if (updateError || !updated) {
            console.error('Finalize image row failed:', updateError);
            return fail('Failed to finalize image record', 500);
        }

        return ok(updated, 201);
        } catch (pipelineError) {
        const message =
            pipelineError instanceof Error ? pipelineError.message : 'Image processing failed';

        console.error('Image pipeline failed:', message);

        await supabaseAdmin
            .from('images')
            .update({
            status: 'failed',
            error_message: message,
            })
            .eq('user_id', user.id)
            .eq('id', createdRow.id);

        return fail('Image processing failed', 500);
        }
    } catch (err) {
        console.error('Invalid request in POST /api/images:', err);
        return fail('Invalid request', 400);
    }
}