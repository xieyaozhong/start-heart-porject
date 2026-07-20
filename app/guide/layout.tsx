import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Discovery & the One-Life Registry Work — NOCTUA",
  description: "Learn how NOCTUA models celestial candidates, why each person may purchase only once, how research continues, and when to look toward the system from your location.",
};

export default function GuideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
