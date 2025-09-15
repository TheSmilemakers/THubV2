'use client';

import { UIShowcase } from '@/components/demo/ui-showcase';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';

export default function ShowcasePage() {
  return <UIShowcase />;
}