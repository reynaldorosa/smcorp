'use client';

import { Providers } from '@/app/providers';

export default function PortalClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
