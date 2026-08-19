import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

const playfair = Playfair_Display({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rental Car Connect",
  description: "Rent a reliable car in Harare with flexible dates, clear pricing, and local support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-slate-50 antialiased font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
