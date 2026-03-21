import { supabaseAdmin } from '@/lib/supabase-admin';
import { deleteProcessedImage } from '@/lib/storage';
import { getAuthenticatedUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

export const runtime = 'nodejs';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError || !user) return fail('Unauthorized', 401);

  const { data: row, error: findError } = await supabaseAdmin
    .from('images')
    .select('id, storage_path')
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
