import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | Handmade & Artificial Flowers`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.tagline,
};

export const viewport: Viewport = {
  themeColor: "#fff0f5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers user={user}>{children}</Providers>
      </body>
    </html>
  );
}
