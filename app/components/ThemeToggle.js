'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from './Icons';

function current() {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('methg-theme', theme);
  } catch {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0e24' : '#f5f6fa');
}

// variant "icon": a small sun/moon button for the header. variant "switch": Light | Dark for the Account page.
export default function ThemeToggle({ variant = 'icon' }) {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    setTheme(current());
    if (current() === 'dark') apply('dark');
  }, []);

  function choose(t) {
    apply(t);
    setTheme(t);
  }

  if (variant === 'switch') {
    return (
      <div className="seg" role="radiogroup" aria-label="Appearance">
        <button type="button" role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => choose('light')}>
          Light
        </button>
        <button type="button" role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => choose('dark')}>
          Dark
        </button>
      </div>
    );
  }

  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className="iconbtn" onClick={() => choose(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
