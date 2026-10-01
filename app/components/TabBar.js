'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, InboxIcon, ListIcon, PeopleIcon, UserIcon } from './Icons';

const STAFF = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/requests', label: 'Requests', Icon: ListIcon },
  { href: '/account', label: 'Account', Icon: UserIcon },
];
const MANAGER = [
  { href: '/manager', label: 'Approvals', Icon: InboxIcon },
  { href: '/manager/history', label: 'History', Icon: ListIcon },
  { href: '/manager/staff', label: 'Staff', Icon: PeopleIcon },
  { href: '/account', label: 'Account', Icon: UserIcon },
];

export default function TabBar({ role }) {
  const path = usePathname();
  const tabs = role === 'manager' ? MANAGER : STAFF;
  return (
    <div className="tabbar">
      <nav aria-label="Main" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map(({ href, label, Icon }) => {
          const on = path === href || (href === '/manager/staff' && path.startsWith('/manager/staff/'));
          return (
          <Link key={href} href={href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
            <Icon />
            {label}
          </Link>
          );
        })}
      </nav>
    </div>
  );
}
