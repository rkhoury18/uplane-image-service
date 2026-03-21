import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { deleteProcessedImage } from '@/lib/storage';

export const runtime = 'nodejs';

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

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
)
{
    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const { user, error: authError } = await getAuthenticatedUser(_request);
    if (authError || !user) return fail('Unauthorized', 401);
    
    const { data: row , error: findError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !row) {
        return fail('Image not found', 404);
    }

    try {
        if (row.storage_path) {
        await deleteProcessedImage(row.storage_path);
        }

        const { error: deleteError } = await supabaseAdmin
        .from('images')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

        if (deleteError) {
        console.error('DB delete failed:', deleteError);
        return fail('Failed to delete image record', 500);
        }

        return ok({ id, deleted: true });
    } catch (err) {
        console.error('DELETE /api/images/:id failed:', err);
        return fail('Failed to delete image', 500);
    }
}