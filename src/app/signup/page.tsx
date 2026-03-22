'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [errors, setErrors] = useState({ email: '', password: '' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = {
      email: !email ? 'Email is required.' : '',
      password: !password
        ? 'Password is required.'
        : password.length < 6
        ? 'Password must be at least 6 characters.'
        : '',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    try {
      setIsSubmitting(true);

      const { data, error } = await supabaseBrowser.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user?.identities?.length === 0) {
        toast.error('An account with this email already exists. Please log in instead.');
        return;
      }

      setConfirmedEmail(email);
    } catch {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                Get Started Today
              </h2>
              <h2 className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                For Free
              </h2>
            </div>

            <p className="text-lg text-slate-600 max-w-md">
              Create an account to save, manage, and revisit the images you process. Share them via URL or delete them whenever you like.
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

          {/* Right card — form or confirmation */}
          <section>
            {confirmedEmail ? (
              <Card className="border border-slate-200 bg-white shadow-lg rounded-2xl">
                <CardContent className="pt-10 pb-10 px-8 flex flex-col items-center text-center gap-5">
                  <div className="flex size-16 items-center justify-center rounded-full bg-blue-100">
                    <Mail className="size-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-slate-900">Check your inbox</CardTitle>
                    <CardDescription className="text-slate-600 text-sm leading-relaxed">
                      We sent a confirmation link to{' '}
                      <span className="font-semibold text-slate-900">{confirmedEmail}</span>.
                      Click the link in that email to activate your account, then come back to log in.
                    </CardDescription>
                  </div>
                  <div className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Didn&apos;t receive it? Check your spam folder or{' '}
                    <button
                      className="font-semibold underline underline-offset-2 hover:text-blue-900"
                      onClick={() => setConfirmedEmail(null)}
                    >
                      try a different email
                    </button>
                    .
                  </div>
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full h-11">
                      Back to log in
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
                <Card className="border border-slate-200 bg-white shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
                    <CardDescription className="text-slate-600">
                      Sign up to manage your images privately
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
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
                        <label className="text-sm font-medium text-slate-900">Password</label>
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

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                      Already have an account?{' '}
                      <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                        Log in
                      </Link>
                    </p>
                  </CardContent>
                </Card>

            )}
          </section>
        </div>
      </div>
    </main>
  );
}
