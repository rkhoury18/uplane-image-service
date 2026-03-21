import { supabaseAdmin } from './supabase-admin';

export async function getAuthenticatedUser(request: Request) {
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
