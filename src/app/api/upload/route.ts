import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createAdminServerClient } from '@/lib/supabase-server';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const filesToProcess: File[] = [];
    if (singleFile && singleFile instanceof File) {
      filesToProcess.push(singleFile);
    }
    for (const f of files) {
      if (f instanceof File && !filesToProcess.includes(f)) {
        filesToProcess.push(f);
      }
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image file was uploaded.' },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    let adminClient: any = null;
    if (isSupabaseConfigured) {
      try {
        adminClient = createAdminServerClient();
      } catch (err) {
        console.warn('Supabase admin client unavailable for upload:', err);
      }
    }

    const uploadedResults: Array<{ url: string; filename: string }> = [];

    for (const file of filesToProcess) {
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error: `File type "${file.type}" is not supported. Please upload JPG, PNG, WEBP, or AVIF.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name}" exceeds maximum allowed size of 15MB.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const safeBase = path
        .basename(file.name, ext)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 30);
      const uniqueSuffix = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const filename = `${safeBase}_${uniqueSuffix}${ext}`;

      // 1. Save locally to public/uploads
      const localFilePath = path.join(uploadsDir, filename);
      await writeFile(localFilePath, buffer);
      let publicUrl = `/uploads/${filename}`;

      // 2. Also try uploading to Supabase Storage bucket 'product-media'
      if (adminClient) {
        try {
          const { data, error: uploadErr } = await adminClient.storage
            .from('product-media')
            .upload(filename, buffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!uploadErr && data) {
            const { data: pubData } = adminClient.storage
              .from('product-media')
              .getPublicUrl(filename);
            if (pubData?.publicUrl) {
              publicUrl = pubData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Failed to upload to Supabase storage bucket, using local URL:', storageErr);
        }
      }

      uploadedResults.push({
        url: publicUrl,
        filename,
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadedResults[0].url,
      filename: uploadedResults[0].filename,
      urls: uploadedResults.map((r) => r.url),
      files: uploadedResults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error handling upload:', err);
    return NextResponse.json(
      { success: false, error: message || 'Failed to process uploaded file.' },
      { status: 500 }
    );
  }
}
