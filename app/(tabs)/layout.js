import { requireSession } from '../../lib/auth';
import { TopBar, TabBar } from '../components/Chrome';

// The header and tab bar stay on screen while you move between tabs;
// only the part in the middle changes (and shows loading.js while it loads).
export default async function TabsLayout({ children }) {
  const session = await requireSession();
  return (
    <>
      <TopBar session={session} />
      {children}
      <TabBar role={session.role} />
    </>
  );
}
