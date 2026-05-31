import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TopNav } from "@/components/top-nav";

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
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <TopNav />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

