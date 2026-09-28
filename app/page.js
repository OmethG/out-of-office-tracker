import { headers } from 'next/headers';
import RequestForm from './RequestForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const headerList = await headers();
  const employeeName = headerList.get('x-employee-name') || '';

  return <RequestForm employeeName={employeeName} />;
}
