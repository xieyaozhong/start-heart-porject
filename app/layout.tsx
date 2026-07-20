import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./experience.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "noctua.local";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "NOCTUA — Live Celestial Systems & Private Registry";
  const description = "Explore live orbital models, candidate exoplanet classifications, atmospheric forecasts and a private celestial registry.";
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [`${origin}/noctua-social-v3.png`] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/noctua-social-v3.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
