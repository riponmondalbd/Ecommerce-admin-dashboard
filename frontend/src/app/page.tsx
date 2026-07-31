import { redirect } from 'next/navigation';

/**
 * Root page - server-side redirect to dashboard or login.
 * This ensures the page is accessible even before JavaScript loads.
 */
export default function RootPage() {
  // Server-side redirect: always send to login first
  // The client-side Protect wrapper will handle the actual redirect based on auth state
  redirect('/login');
}
