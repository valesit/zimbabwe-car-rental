import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export async function HomePromoBanner() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_promo')
    .select('banner_url, headline, subheadline, cta_label, cta_href')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data?.banner_url) return null;

  const href = data.cta_href?.trim() || '/listings';

  return (
    <section className="relative border-b border-teal-900/20">
      <Link href={href} className="group relative block h-44 overflow-hidden sm:h-52 md:h-60">
        <Image
          src={data.banner_url}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-transparent" />
        {(data.headline || data.subheadline || data.cta_label) && (
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
            {data.headline && (
              <h2 className="max-w-xl font-brand text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
                {data.headline}
              </h2>
            )}
            {data.subheadline && (
              <p className="mt-2 max-w-lg text-sm text-teal-100/90 sm:text-base">{data.subheadline}</p>
            )}
            {data.cta_label && (
              <span className="mt-4 inline-flex w-fit items-center rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition group-hover:bg-teal-400">
                {data.cta_label} →
              </span>
            )}
          </div>
        )}
      </Link>
    </section>
  );
}
