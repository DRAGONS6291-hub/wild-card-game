import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AdScript } from "@/components/AdScript";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Wild Card",
  description: "Le jeu de cartes ultime",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
          <AdScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker enregistré'))
                    .catch(err => console.log('Erreur SW:', err));
                }
              `,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}