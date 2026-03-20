'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 8;

interface CarImageUploaderProps {
  ownerIdForStoragePath: string;
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

export function CarImageUploader({
  ownerIdForStoragePath,
  imageUrls,
  onChange,
}: CarImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('You must be logged in to upload.');
      return;
    }

    const remaining = MAX_FILES - imageUrls.length;
    if (remaining <= 0) {
      setMessage(`Maximum ${MAX_FILES} images. Remove one to add more.`);
      return;
    }

    setUploading(true);
    const next = [...imageUrls];
    const list = Array.from(files).slice(0, remaining);

    for (const file of list) {
      if (!file.type.startsWith('image/')) {
        setMessage('Only image files are allowed.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setMessage('Each image must be 5MB or smaller.');
        continue;
      }
      const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${ownerIdForStoragePath}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from('car-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        setMessage(error.message);
        break;
      }
      const { data: pub } = supabase.storage.from('car-images').getPublicUrl(path);
      next.push(pub.publicUrl);
    }

    onChange(next);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(imageUrls.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-gray-700">Photos</span>
      <p className="text-xs text-gray-500">
        Upload up to {MAX_FILES} images (max 5MB each). You can still add external URLs below.
      </p>

      {imageUrls.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {imageUrls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="relative h-24 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="128px" unoptimized={url.includes('unsplash.com')} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white hover:bg-black/80"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading || imageUrls.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border-2 border-dashed border-teal-300 bg-teal-50/50 px-4 py-2.5 text-sm font-medium text-teal-800 transition hover:border-teal-400 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '+ Upload images'}
        </button>
      </div>
      {message && <p className="text-sm text-amber-700">{message}</p>}
    </div>
  );
}
