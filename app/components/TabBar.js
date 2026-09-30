'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, InboxIcon, ListIcon, UserIcon } from './Icons';

const STAFF = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/requests', label: 'Requests', Icon: ListIcon },
  { href: '/account', label: 'Account', Icon: UserIcon },
];
const MANAGER = [
  { href: '/manager', label: 'Approvals', Icon: InboxIcon },
  { href: '/manager/history', label: 'History', Icon: ListIcon },
  { href: '/account', label: 'Account', Icon: UserIcon },
];

export default function TabBar({ role }) {
  const path = usePathname();
  const tabs = role === 'manager' ? MANAGER : STAFF;
  return (
    <div className="tabbar">
      <nav aria-label="Main">
        {tabs.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={path === href ? 'on' : ''} aria-current={path === href ? 'page' : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
