'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in email and password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password should be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabaseBrowser.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created. You can now log in.');
      router.push('/login');
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
              Join thousands of users who transform their images with AI-powered
              background removal and instant shareable URLs.
            </p>

            <ul className="space-y-4">
              {[
                ['AI-Powered Background Removal', 'Remove backgrounds from any image with precision and speed'],
                ['Instant Transformation', 'Horizontal flipping and processing in just a few clicks'],
                ['Shareable URLs', 'Get unique URLs for every processed image, ready to share anywhere'],
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

          {/* Right signup card */}
          <section>
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
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-11 bg-slate-50 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-900">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        className="h-11 pr-11 bg-slate-50 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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

            <p className="mt-4 text-center text-xs text-slate-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
