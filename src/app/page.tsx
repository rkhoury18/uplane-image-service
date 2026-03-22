'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, Upload, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import type { ImageRecord } from '@/types/image';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

async function getAuthHeader() {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Please log in first');
  return { Authorization: `Bearer ${token}` };
}

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ImageRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setUserEmail(session.user.email ?? '');
    });
  }, [router]);

  const fetchImages = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoadingList(true);
      const headers = await getAuthHeader();
      const res = await fetch('/api/images', { cache: 'no-store', headers });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to load images');
      }

      setImages((payload.data ?? []) as ImageRecord[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch images';
      toast.error(message);
    } finally {
      if (showLoader) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const hasProcessing = images.some((img) => img.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchImages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [images, fetchImages]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Unsupported format. Please upload PNG, JPG, JPEG, or WEBP.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);

      const headers = await getAuthHeader();
      const res = await fetch('/api/images', {
        method: 'POST',
        headers,
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Upload failed');
      }

      toast.success('Image processed successfully');
      setFile(null);

      const fileInput = document.getElementById('image-input') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';

      await fetchImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCopyUrl(id: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleRename(id: string) {
    const trimmed = editingName.trim();
    setEditingId(null);
    if (!trimmed) return;

    const original = images.find((img) => img.id === id)?.original_filename;
    if (trimmed === original) return;

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/images/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: trimmed }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Rename failed');
      setImages((prev) => prev.map((img) => img.id === id ? { ...img, original_filename: trimmed } : img));
      toast.success('Image name updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rename failed';
      toast.error(message);
    }
  }

  async function handleDelete(id: string) {
    try {
      setIsDeleting(true);
      const headers = await getAuthHeader();
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE', headers });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Delete failed');
      }

      toast.success('Image deleted');
      setDeleteTarget(null);
      await fetchImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete image';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  function validateAndSetFile(selected: File | null, inputEl?: HTMLInputElement) {
    if (!selected) {
      setFile(null);
      return;
    }
  
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error('Unsupported format. Please upload PNG, JPG, JPEG, or WEBP.');
      setFile(null);
      if (inputEl) inputEl.value = '';
      return;
    }
  
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selected.size > maxSize) {
      toast.error('File size exceeds 10MB limit.');
      setFile(null);
      if (inputEl) inputEl.value = '';
      return;
    }
  
    setFile(selected);
  }
  
  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }
  
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  
    const dropped = e.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(dropped);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Image Transformation Service</h1>
              <p className="text-sm text-slate-500">Remove backgrounds, flip horizontally, and get hosted URLs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden sm:block text-sm text-slate-500 max-w-[220px] truncate">{userEmail}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabaseBrowser.auth.signOut();
                router.push('/login');
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Upload Section */}
        <Card className="bg-white shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Upload image</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Supports PNG, JPG, JPEG, WEBP — max 10 MB
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleUpload}>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl transition-all ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <input
                  id="image-input"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  disabled={isUploading}
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    validateAndSetFile(selected, e.currentTarget);
                  }}
                />

                {isUploading ? (
                  <div className="py-14 flex flex-col items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-full bg-blue-100">
                      <Loader2 className="size-7 text-blue-600 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-900">Processing your image…</p>
                      <p className="text-sm text-slate-500 mt-1">Removing background and flipping — this may take a moment</p>
                    </div>
                  </div>
                ) : file ? (
                  <div className="py-10 flex flex-col items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="size-6 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Process image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFile(null);
                          const el = document.getElementById('image-input') as HTMLInputElement | null;
                          if (el) el.value = '';
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="image-input" className="py-14 flex flex-col items-center gap-3 cursor-pointer">
                    <div className="flex size-14 items-center justify-center rounded-full bg-slate-200">
                      <Upload className="size-6 text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-900">
                        Drop your image here, or <span className="text-blue-600">browse</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-1">PNG, JPG, JPEG, WEBP up to 10 MB</p>
                    </div>
                  </label>
                )}
              </div>
            </form>
          </div>
        </Card>

        {/* Processed Images */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Processed images</h2>

          {loadingList ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between gap-4">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-4 bg-slate-200 rounded w-12" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-8 bg-slate-100 rounded flex-1" />
                      <div className="h-8 w-8 bg-slate-100 rounded" />
                      <div className="h-8 w-8 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <Card className="bg-white shadow-sm">
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
                  <Sparkles className="size-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">No processed images yet</p>
                  <p className="text-sm text-slate-500 mt-1">Upload an image above to get started</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img) => (
                <div key={img.id} className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Thumbnail */}
                  <div
                    className="aspect-square overflow-hidden relative"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    {img.status === 'ready' && img.processed_url ? (
                      <img
                        src={img.processed_url}
                        alt={`Processed ${img.original_filename}`}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50/80">
                        <Loader2 className="size-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500">Processing…</p>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      {editingId === img.id ? (
                        <input
                          autoFocus
                          className="text-sm font-medium text-slate-900 truncate min-w-0 w-full bg-transparent border-b border-blue-400 outline-none"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleRename(img.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(img.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <p
                          className="text-sm font-medium text-slate-900 truncate min-w-0 cursor-pointer hover:text-blue-600"
                          onClick={() => { setEditingId(img.id); setEditingName(img.original_filename); }}
                          title="Click to rename"
                        >
                          {img.original_filename}
                        </p>
                      )}
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        img.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {img.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{formatDate(img.created_at)}</p>

                    <div className="flex gap-2 pt-1">
                      {img.status === 'ready' && img.processed_url ? (
                        <>
                          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                            <a href={img.processed_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2.5"
                            onClick={() => handleCopyUrl(img.id, img.processed_url!)}
                            title="Copy image URL"
                          >
                            {copiedId === img.id
                              ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                              : <Copy className="h-3.5 w-3.5" />
                            }
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            onClick={() => setDeleteTarget(img)}
                            disabled={isDeleting && deleteTarget?.id === img.id}
                            title="Delete image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 ml-auto"
                          onClick={() => setDeleteTarget(img)}
                          disabled={isDeleting && deleteTarget?.id === img.id}
                          title="Delete image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete image?</DialogTitle>
            <DialogDescription>
              This will permanently remove the processed image and its hosted URL. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-900 truncate">{deleteTarget?.original_filename}</p>
            {deleteTarget?.processed_url && (
              <a
                href={deleteTarget.processed_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-blue-600 hover:underline"
              >
                View image ↗
              </a>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete permanently'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}