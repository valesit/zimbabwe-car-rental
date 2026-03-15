import Link from 'next/link';
import { SignupForm } from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Sign up</h1>
      <p className="mt-2 text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-slate-800 underline">
          Log in
        </Link>
      </p>
      <SignupForm />
    </div>
  );
}
