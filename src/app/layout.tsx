'use client';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';

// Metadata cannot be exported from a client component, so we define it here if needed
// export const metadata: Metadata = { ... };
// However, since this is a client component now, we'd set the title via useEffect or another client-side mechanism if dynamic.
// For a static title, it can remain in a parent server component or be set directly in the HTML head below.


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Define pages that do NOT need the Firebase provider, e.g., a landing page.
  const noFirebasePages = ['/landing']; // Add any other paths here

  const showFirebase = !noFirebasePages.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Doçuras da Fran</title>
        <meta name="description" content="Seu assistente financeiro para confeitarias." />
        <meta name="manifest" content="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {showFirebase ? (
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
          ) : (
            children
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
