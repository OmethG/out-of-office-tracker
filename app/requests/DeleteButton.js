'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const btn = {
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: '#c0392b',
  background: '#fff',
  border: '1px solid #c0392b',
  borderRadius: 6,
  cursor: 'pointer',
};

export default function DeleteButton({ id, employeeName }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(`Delete ${employeeName}'s request? This can't be undone.`);
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Failed to delete. Please try again.');
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      alert('Network error. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleting} style={btn}>
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
