import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StoreGuard } from '@/components/common';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Caiso - Sistema de Gestão de Treinamentos',
  description: 'Plataforma de gerenciamento de treinamentos offshore',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <StoreGuard>
            <ErrorBoundary>{children}</ErrorBoundary>
          </StoreGuard>
        </Providers>
      </body>
    </html>
  );
}
