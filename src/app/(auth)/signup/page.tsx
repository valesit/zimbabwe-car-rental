import Image from 'next/image';
import Link from 'next/link';
import { SignupForm } from '@/components/SignupForm';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1756818564457-7706ab6a68e7?auto=format&fit=crop&w=1800&q=88';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params.redirect ?? '/dashboard';
  const loginHref =
    redirect !== '/dashboard'
      ? `/login?redirect=${encodeURIComponent(redirect)}`
      : '/login';

  return (
    <section className="bg-[#fbfcfb] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto grid min-h-[700px] max-w-7xl overflow-hidden rounded-[2rem] border border-[#e3e9e5] bg-white shadow-[0_30px_80px_-52px_rgba(17,48,37,0.34)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center px-6 py-12 sm:px-10 lg:px-14 xl:px-16">
          <div className="mx-auto w-full max-w-[460px]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3d7a61]">Rental Car Connect</p>
            <h1 className="font-display mt-4 text-4xl font-medium tracking-[-0.045em] text-[#111714] sm:text-5xl">
              Create your account.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-[#5b6a64]">
              Book cars, manage your trips, and get support in one simple place.
            </p>

            <SignupForm redirectTo={redirect} />

            <p className="mt-7 text-center text-sm text-[#62716b]">
              Already have an account?{' '}
              <Link href={loginHref} className="font-semibold text-[#2f765c] transition hover:text-[#1f5b44]">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden min-h-[700px] overflow-hidden lg:block">
          <Image
            src={AUTH_IMAGE}
            alt="Toyota RAV4 on a scenic journey"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'center 52%' }}
            sizes="55vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a20]/75 via-[#0d2a20]/10 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/85">Travel with confidence</p>
            <h2 className="font-display mt-3 max-w-lg text-4xl font-medium leading-tight tracking-[-0.04em]">
              One account for every trip.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
              Find the right car, keep your booking details together, and reach local support when you need it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
