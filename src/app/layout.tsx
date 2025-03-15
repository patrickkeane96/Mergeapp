import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NavBar } from "@/components/nav-bar";
import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { NotificationsProvider } from '@/lib/contexts/NotificationsContext'
import { Navbar } from '@/components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Merger Reform Calculator",
  description: "Calculate merger control milestones based on filing date",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <NotificationsProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </ThemeProvider>
        </NotificationsProvider>
      </body>
    </html>
  );
}
