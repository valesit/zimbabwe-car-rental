import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zimbabwe Car Rental",
  description: "Rent a car in Zimbabwe from local owners. Browse by location, dates, and type.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
