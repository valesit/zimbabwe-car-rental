import { createClient } from '@/lib/supabase/server';
import { PromoBannerForm, type SitePromoState } from '@/components/PromoBannerForm';

export default async function AdminPromoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_promo')
    .select('banner_url, headline, subheadline, cta_label, cta_href')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-semibold">Promo settings unavailable</h1>
        <p className="mt-2 text-sm">
          Run migration <code className="rounded bg-amber-100 px-1">008_storage_and_site_promo.sql</code> in the
          Supabase SQL Editor, then refresh this page.
        </p>
        <p className="mt-2 font-mono text-xs opacity-80">{error.message}</p>
      </div>
    );
  }

  const initial: SitePromoState = {
    banner_url: data?.banner_url ?? null,
    headline: data?.headline ?? null,
    subheadline: data?.subheadline ?? null,
    cta_label: data?.cta_label ?? null,
    cta_href: data?.cta_href ?? null,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Promo banner</h1>
      <p className="mt-1 text-slate-600">
        Home page hero promo — image, headline, and optional button. Uploads go to the{' '}
        <code className="rounded bg-slate-200/80 px-1 text-sm">promo-banners</code> bucket.
      </p>
      <div className="mt-8">
        <PromoBannerForm initial={initial} />
      </div>
    </div>
  );
}
