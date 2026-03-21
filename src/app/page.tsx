'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

type ImageRecord = {
  id: string;
  original_filename: string;
  status: 'processing' | 'ready' | 'failed';
  processed_url: string | null;
  storage_path: string | null;
  error_message: string | null;
  created_at: string;
};

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
  const [processingMessage, setProcessingMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ImageRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

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

    setProcessingMessage('Uploading image...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setProcessingMessage('Removing background and flipping image...');

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

      setProcessingMessage('');
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
      setProcessingMessage('');
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Upload className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Image Transformation Service</h1>
              <p className="text-sm text-slate-500">Remove backgrounds, flip horizontally, and get hosted URLs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-sm text-slate-600 max-w-[220px] truncate">{userEmail}</span>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                await supabaseBrowser.auth.signOut();
                router.push('/login');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
  
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Upload Section */}
        <Card className="p-8 bg-white shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Upload image</h2>
            <p className="text-slate-600">
              Upload an image to remove background and flip it horizontally
            </p>
          </div>
  
          <form onSubmit={handleUpload} className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
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
              {file ? (
                <div className="space-y-3">
                  <p className="font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Process image
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => {
                        setFile(null);
                        const fileInput = document.getElementById('image-input') as HTMLInputElement | null;
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto size-10 text-slate-400 mb-3" />
                  <p className="text-base font-medium text-slate-900">
                    Drop your image here, or browse files
                  </p>
                  <p className="text-sm text-slate-500 mt-1">PNG, JPG, JPEG, WEBP (max 10MB)</p>
                  <label
                    htmlFor="image-input"
                    className="inline-block mt-4 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Browse files
                  </label>
                </div>
              )}
            </div>
  
            {isUploading && (
              <p className="text-sm text-muted-foreground">{processingMessage}</p>
            )}
          </form>
        </Card>
  
        {/* Processed Images */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Processed images</h2>
  
          {loadingList ? (
            <p className="text-sm text-muted-foreground">Loading images...</p>
          ) : images.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-slate-600">No processed images yet.</p>
                <p className="text-sm text-slate-500 mt-1">
                  Upload an image above to create your first result.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img) => (
                <Card key={img.id} className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    {img.status === 'ready' && img.processed_url ? (
                      <img
                        src={img.processed_url}
                        alt={`Processed ${img.original_filename}`}
                        className="w-full h-full object-contain p-3"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground px-4 text-center">
                        {img.status === 'failed' ? 'Processing failed' : 'Processing...'}
                      </p>
                    )}
                  </div>
  
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-900 truncate">{img.original_filename}</p>
                      <span
                        className={
                          img.status === 'ready'
                            ? 'text-green-600 text-xs font-medium'
                            : img.status === 'failed'
                            ? 'text-red-600 text-xs font-medium'
                            : 'text-amber-600 text-xs font-medium'
                        }
                      >
                        {img.status}
                      </span>
                    </div>
  
                    <div className="flex gap-2">
                      {img.status === 'ready' && img.processed_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={img.processed_url} target="_blank" rel="noreferrer">
                            View image
                          </a>
                        </Button>
                      )}
  
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(img)}
                        disabled={isDeleting && deleteTarget?.id === img.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
  
                    {img.status === 'failed' && (
                      <p className="text-xs text-red-600">
                        {img.error_message || 'Unknown processing error'}
                      </p>
                    )}
                  </CardContent>
                </Card>
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
              This action will permanently delete the processed image and cannot be undone.
            </DialogDescription>
          </DialogHeader>
  
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium truncate">{deleteTarget?.original_filename}</p>
            {deleteTarget?.processed_url && (
              <a
                href={deleteTarget.processed_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
              >
                Image link
              </a>
            )}
          </div>
  
          <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0 pt-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}