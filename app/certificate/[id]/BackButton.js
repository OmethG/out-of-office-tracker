'use client';

import { useRouter } from 'next/navigation';

// Goes back to wherever the certificate was opened from; falls back to a fixed page when opened from an email.
export default function BackButton({ fallback }) {
  const router = useRouter();
  return (
    <button type="button" className="close" onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}>
      ✕ Close
    </button>
  );
}
