import { supabaseAdmin } from './supabase-admin';

const bucket = process.env.SUPABASE_BUCKET || 'processed-images';

export async function uploadProcessedImage(buffer: Buffer): Promise<{
  storagePath: string;
  publicUrl: string;
}> {
  const fileName = `${Date.now()}-${crypto.randomUUID()}.png`;
  const storagePath = `processed/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);

  return { storagePath, publicUrl: data.publicUrl };
}

export async function deleteProcessedImage(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([storagePath]);
  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}