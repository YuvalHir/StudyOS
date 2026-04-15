import type { Metadata } from "next";
import "./globals.css";
import I18nProvider from "@/components/Providers/I18nProvider";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import { QueryProvider } from "@/components/Providers/QueryProvider";

import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "StudyOS",
  description: "Academic management made simple",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('i18next')?.value || 'he';
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider>
              {children}
            </I18nProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
