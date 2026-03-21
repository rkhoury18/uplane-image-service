# Image Transformation Service

A full-stack image processing application that removes backgrounds from uploaded images, flips them horizontally, and provides hosted shareable URLs.

**Live demo:** https://uplane-image-service-vercell.vercel.app

## Features

- Upload images (PNG, JPG, JPEG, WEBP — up to 10 MB)
- AI-powered background removal via [remove.bg](https://www.remove.bg/)
- Automatic horizontal flip after background removal
- Processed images hosted in Supabase Storage with unique public URLs
- Copy-to-clipboard URL sharing
- Delete images (removes from storage and database)
- User authentication (sign up, log in, forgot password, email confirmation)
- Drag-and-drop upload with real-time processing feedback

## Tech Stack

- **Frontend & Backend:** Next.js 16 (App Router) with TypeScript
- **Auth & Database:** Supabase (PostgreSQL + Auth)
- **Image Storage:** Supabase Storage
- **Background Removal:** remove.bg API
- **Image Processing:** Sharp
- **UI:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

## Architecture

```
POST /api/images
  → validate file (type, size)
  → insert DB record (status: processing)
  → removeBackground() — calls remove.bg API
  → sharp().flop() — horizontal flip
  → uploadProcessedImage() — stores PNG in Supabase Storage
  → update DB record (status: ready, processed_url)

DELETE /api/images/:id
  → verify ownership
  → delete from Supabase Storage
  → delete DB record
```

All API routes use Bearer token authentication validated server-side via the Supabase Admin client.

## Local Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [remove.bg](https://www.remove.bg/api) API key (free tier available)

### 1. Clone and install

```bash
git clone <repo-url>
cd uplane-image-service
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role secret key |
| `SUPABASE_BUCKET` | Name of your Supabase Storage bucket (default: `processed-images`) |
| `REMOVE_BG_API_KEY` | remove.bg → Account → API Keys |

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor. This creates the `images` table with indexes and Row Level Security policies.

Create a public Storage bucket named `processed-images` (or the name you set in `SUPABASE_BUCKET`).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
