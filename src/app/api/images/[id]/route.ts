import { supabaseAdmin } from '@/lib/supabase-admin';
import { deleteProcessedImage } from '@/lib/storage';
import { getAuthenticatedUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError || !user) return fail('Unauthorized', 401);

  let filename: unknown;
  try {
    ({ filename } = await request.json());
  } catch {
    return fail('Invalid request body', 400);
  }

  if (!filename || typeof filename !== 'string' || !filename.trim()) {
    return fail('Image name cannot be empty', 400);
  }

  const { data: updated, error } = await supabaseAdmin
    .from('images')
    .update({ original_filename: filename.trim() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error || !updated) {
    return fail('Failed to update image', 500);
  }

  return ok(updated);
}

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
