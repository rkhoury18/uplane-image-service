'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase v2 PKCE flow: exchange the code in the URL for a session
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabaseBrowser.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setSessionError(true);
        else setReady(true);
      });
      return;
    }

    // Fallback: implicit flow — listen for PASSWORD_RECOVERY event from hash tokens
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = {
      password: !password
        ? 'Password is required.'
        : password.length < 6
        ? 'Password must be at least 6 characters.'
        : '',
      confirmPassword: !confirmPassword
        ? 'Please confirm your password.'
        : password !== confirmPassword
        ? 'Passwords do not match.'
        : '',
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirmPassword) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabaseBrowser.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/'), 2500);
    } catch {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <Sparkles className="size-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900">Image Transformation Service</span>
        </div>

        <Card className="border border-slate-200 bg-white shadow-lg rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {done ? 'Password updated' : 'Set new password'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {done
                ? 'Redirecting you to the app…'
                : sessionError
                ? 'This reset link has expired or is invalid.'
                : !ready
                ? 'Verifying your reset link…'
                : 'Choose a new password for your account.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="size-7 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600 text-center">
                  Your password has been updated. Taking you to the app now.
                </p>
              </div>
            ) : sessionError ? (
              <div className="space-y-4 py-2">
                <p className="text-sm text-slate-600">
                  Reset links expire after a short time. Please request a new one.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => router.push('/login')}
                >
                  Back to sign in
                </Button>
              </div>
            ) : !ready ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-7 text-blue-500 animate-spin" />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-900">New password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                      autoComplete="new-password"
                      className={`h-11 pr-11 bg-slate-50 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-900">Confirm new password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                    autoComplete="new-password"
                    className={`h-11 bg-slate-50 ${errors.confirmPassword ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200'}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
