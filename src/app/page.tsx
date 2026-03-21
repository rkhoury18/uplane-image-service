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

type ImageRecord = {
  id: string;
  original_filename: string;
  status: 'processing' | 'ready' | 'failed';
  processed_url: string | null;
  storage_path: string | null;
  error_message: string | null;
  created_at: string;
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [processingMessage, setProcessingMessage] = useState('');
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const [deleteTarget, setDeleteTarget] = useState<ImageRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchImages = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoadingList(true);
      const res = await fetch('/api/images', { cache: 'no-store' });
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

      const res = await fetch('/api/images', {
        method: 'POST',
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
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Image Transformation Service</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Upload an image, remove the background, flip it horizontally, and get a hosted URL.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Upload image</CardTitle>
          <CardDescription>Accepted: PNG, JPG, JPEG, WEBP (max 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              id="image-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                if (!selected) {
                  setFile(null);
                  return;
                }
              
                if (!ALLOWED_TYPES.includes(selected.type)) {
                  toast.error('Unsupported format. Please upload PNG, JPG, JPEG, or WEBP.');
                  setFile(null);
                  e.currentTarget.value = '';
                  return;
                }
              
                setFile(selected);
              }}
              disabled={isUploading}
            />
            <Button type="submit" disabled={isUploading} className="sm:w-auto">
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
            {isUploading && (
              <p className="text-sm text-muted-foreground mt-2">{processingMessage}</p>
            )}
          </form>
          {!file && (
            <p className="text-xs text-muted-foreground">No file selected yet.</p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Processed images</h2>

        {loadingList ? (
          <p className="text-sm text-muted-foreground">Loading images...</p>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No images yet. Upload your first image above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {images.map((img) => (
              <Card key={img.id}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base truncate">{img.original_filename}</CardTitle>
                  <CardDescription>
                    Status: <span
                              className={
                                img.status === 'ready'
                                  ? 'text-green-600 font-medium'
                                  : img.status === 'failed'
                                  ? 'text-red-600 font-medium'
                                  : 'text-amber-600 font-medium'
                              }
                            >
                              {img.status}
                            </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {img.status === 'ready' && img.processed_url ? (
                    <>
                      <img
                        src={img.processed_url}
                        alt={`Processed ${img.original_filename}`}
                        className="w-full h-48 object-contain rounded-md border bg-muted/20"
                      />
                      <a
                        href={img.processed_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View processed image
                      </a>
                    </>
                  ) : img.status === 'failed' ? (
                    <p className="text-sm text-red-600">
                      Failed: {img.error_message || 'Unknown processing error'}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Processing in progress...</p>
                  )}

                  <div className="flex justify-end">
                    <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(img)} disabled={isDeleting && deleteTarget?.id === img.id}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => {if (!open) setDeleteTarget(null);}}>
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