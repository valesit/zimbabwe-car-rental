import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params.redirect ?? '/dashboard';

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Log in</h1>
      <p className="mt-2 text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-slate-800 underline">
          Sign up
        </Link>
      </p>
      <LoginForm redirectTo={redirect} />
    </div>
  );
}
