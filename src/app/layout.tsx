import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Weather App",
  description: "Descubre el clima de cualquier ciudad del mundo",
  authors: [{ name: "Weather App" }],
  keywords: ["clima", "weather", "temperatura", "pronóstico"],
  openGraph: {
    title: "Weather App",
    description: "Descubre el clima de cualquier ciudad del mundo",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 min-h-screen">
        {children}
      </body>
    </html>
  );
}
