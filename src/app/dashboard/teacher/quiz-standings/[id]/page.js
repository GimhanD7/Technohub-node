import { Suspense } from 'react';
export async function generateStaticParams() { return [{ id: '1' }]; }
import ClientPage from './page.client';
export default function Page() { return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>; }
