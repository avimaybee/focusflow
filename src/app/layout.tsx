
'use client';


import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/context/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { usePathname } from 'next/navigation';
import { PageTransitionWrapper } from '@/components/layout/page-transition-wrapper';

const fontHeading = Poppins({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '600', '700'],
});

const fontBody = PT_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '700'],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <Providers>
          <Header />
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
          {isLandingPage && <Footer />}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}


