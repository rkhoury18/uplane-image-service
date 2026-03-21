export type ImageRecord = {
    id: string;
    original_filename: string;
    status: 'processing' | 'ready' | 'failed';
    processed_url: string | null;
    storage_path: string | null;
    error_message: string | null;
    created_at: string;
  };