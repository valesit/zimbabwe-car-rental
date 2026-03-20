'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface SitePromoState {
  banner_url: string | null;
  headline: string | null;
  subheadline: string | null;
  cta_label: string | null;
  cta_href: string | null;
}

export function PromoBannerForm({ initial }: { initial: SitePromoState }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url ?? '');
  const [headline, setHeadline] = useState(initial.headline ?? '');
  const [subheadline, setSubheadline] = useState(initial.subheadline ?? '');
  const [ctaLabel, setCtaLabel] = useState(initial.cta_label ?? '');
  const [ctaHref, setCtaHref] = useState(initial.cta_href ?? '/listings');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage('Image must be 8MB or smaller.');
      return;
    }
    setMessage(null);
    setUploading(true);
    const supabase = createClient();
    const path = `home-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage.from('promo-banners').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) {
      setMessage(error.message);
      setUploading(false);
      e.target.value = '';
      return;
    }
    const { data: pub } = supabase.storage.from('promo-banners').getPublicUrl(path);
    setBannerUrl(pub.publicUrl);
    setUploading(false);
    e.target.value = '';
  }

  async function saveCopy(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from('site_promo').upsert(
      {
        id: 1,
        banner_url: bannerUrl.trim() || null,
        headline: headline.trim() || null,
        subheadline: subheadline.trim() || null,
        cta_label: ctaLabel.trim() || null,
        cta_href: ctaHref.trim() || null,
      },
      { onConflict: 'id' },
    );
    if (error) setMessage(error.message);
    else setMessage('Saved.');
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Banner image</h2>
        <p className="mt-1 text-sm text-slate-500">
          Shown at the top of the home page. Recommended wide image (e.g. 1600×600).
        </p>
        {bannerUrl ? (
          <div className="relative mt-4 aspect-[21/9] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <Image src={bannerUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        ) : (
          <div className="mt-4 flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No banner yet — upload below
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : bannerUrl ? 'Replace image' : 'Upload image'}
        </button>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Or paste image URL</span>
          <input
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full max-w-xl rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <form onSubmit={saveCopy} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Copy &amp; link</h2>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Headline</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Summer specials in Harare"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Subheadline</span>
          <textarea
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Optional supporting text"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Button label</span>
            <input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Browse cars"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Button link</span>
            <input
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="/listings"
            />
          </label>
        </div>
        {message && <p className="text-sm text-teal-800">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save promo'}
        </button>
      </form>
    </div>
  );
}
