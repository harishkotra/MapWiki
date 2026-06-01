import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NavigationFrame } from "@/components/navigation-frame";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "MapWiki",
    template: "%s · MapWiki"
  },
  description: "The Wikipedia of maps: collaborative, cited, revisioned geographic datasets.",
  openGraph: {
    title: "MapWiki",
    description: "Create, edit, overlay, and cite community-generated map datasets.",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
  colorScheme: "light"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('mapwiki-theme')||'v2';document.documentElement.dataset.mapwikiTheme=t}catch(e){document.documentElement.dataset.mapwikiTheme='v2'}"
          }}
        />
        <Providers>
          <NavigationFrame />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
