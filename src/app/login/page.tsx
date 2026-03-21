'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = {
      email: !email ? 'Email is required.' : '',
      password: !password ? 'Password is required.' : '',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    try {
      setIsSubmitting(true);
      setUnconfirmedEmail(null);

      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setUnconfirmedEmail(email);
          return;
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          toast.error("Credentials not recognised. Check your email and password, or sign up if you don't have an account.");
          return;
        }
        toast.error(error.message);
        return;
      }

      toast.success('Welcome back!');
      router.push('/');
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setErrors((p) => ({ ...p, email: 'Email is required.' }));
      return;
    }
    try {
      setIsSendingReset(true);
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setResetSent(true);
    } catch {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  }

  async function resendConfirmation() {
    if (!unconfirmedEmail) return;
    try {
      setIsResending(true);
      const { error } = await supabaseBrowser.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setResent(true);
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left marketing panel */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Sparkles className="size-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Image Transformation Service</h1>
            </div>

            <div className="space-y-1">
              <h2 className="text-4xl font-bold leading-tight text-slate-900">
                Transform Your Images
              </h2>
              <h2 className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                In Seconds
              </h2>
            </div>

            <p className="text-lg text-slate-600 max-w-md">
              Upload your image and we'll remove the background and flip it horizontally.
              Your images are saved to your account so you can come back to them anytime — share via URL or delete when you're done.
            </p>

            <ul className="space-y-4">
              {[
                ['Background removal', 'Upload any image and get it back with the background stripped out'],
                ['Horizontal flip', 'Every processed image is automatically mirrored left to right'],
                ['Hosted URLs', 'Each result gets its own URL you can copy and drop anywhere'],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3 items-start">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Right card — login or forgot password */}
          <section>
            <Card className="border border-slate-200 bg-white shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {forgotMode ? 'Reset Password' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {forgotMode
                    ? "Enter your email and we'll send you a reset link."
                    : 'Sign in to your account to continue'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {forgotMode ? (
                  resetSent ? (
                    <div className="flex flex-col items-center text-center gap-4 py-4">
                      <div className="flex size-14 items-center justify-center rounded-full bg-blue-100">
                        <Mail className="size-7 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">Check your inbox</p>
                        <p className="text-sm text-slate-600">
                          We sent a password reset link to{' '}
                          <span className="font-medium text-slate-900">{email}</span>.
                        </p>
                      </div>
                      <button
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        onClick={() => { setForgotMode(false); setResetSent(false); }}
                      >
                        Back to sign in
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={sendResetEmail} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-900">Email</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                          autoComplete="email"
                          className={`h-11 bg-slate-50 ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200'}`}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      </div>
                      <Button
                        type="submit"
                        disabled={isSendingReset}
                        className="w-full h-11 font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                      >
                        {isSendingReset ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                      <p className="text-center text-sm text-slate-600">
                        <button
                          type="button"
                          className="font-semibold text-blue-600 hover:text-blue-700"
                          onClick={() => setForgotMode(false)}
                        >
                          Back to sign in
                        </button>
                      </p>
                    </form>
                  )
                ) : (
                  <>
                    <form onSubmit={onSubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-900">Email</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                          autoComplete="email"
                          className={`h-11 bg-slate-50 ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200'}`}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-900">Password</label>
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => { setForgotMode(true); setErrors({ email: '', password: '' }); }}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                            autoComplete="current-password"
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

                      {unconfirmedEmail && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                          <div className="flex gap-3 items-start">
                            <Mail className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <div className="text-sm text-amber-800">
                              <p className="font-medium">Email not confirmed</p>
                              <p className="mt-0.5">
                                Please check your inbox for{' '}
                                <span className="font-medium">{unconfirmedEmail}</span> and click the confirmation link before signing in.
                              </p>
                            </div>
                          </div>
                          {resent ? (
                            <p className="text-sm text-emerald-700 font-medium pl-7">✓ Confirmation email resent — check your inbox.</p>
                          ) : (
                            <button
                              type="button"
                              onClick={resendConfirmation}
                              disabled={isResending}
                              className="pl-7 text-sm font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-60 flex items-center gap-1.5"
                            >
                              {isResending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              {isResending ? 'Sending…' : 'Resend confirmation email'}
                            </button>
                          )}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                      Don&apos;t have an account?{' '}
                      <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                        Sign Up
                      </Link>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

          </section>
        </div>
      </div>
    </main>
  );
}
