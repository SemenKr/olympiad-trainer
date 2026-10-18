import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.scss";
import LearnerIdentityGate from "./identity/learner-identity-gate";
import SiteFooter from "./site-footer";
import {
  productionOrigin,
  productName,
  productTitle,
  productDescription,
  productOpenGraph,
} from "./site-metadata";

const onest = Onest({
  subsets: ["cyrillic", "latin"],
  variable: "--font-onest",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(productionOrigin),
  title: {
    default: `${productTitle} | ${productName}`,
    template: `%s | ${productName}`,
  },
  description: productDescription,
  applicationName: productName,
  // Public pages opt in; application routes stay out of search by default.
  robots: { index: false, follow: false },
  openGraph: productOpenGraph,
  twitter: {
    card: "summary_large_image",
    title: `${productTitle} | ${productName}`,
    description: productDescription,
    images: [
      { url: "/opengraph-image.png", alt: `${productName} — ${productTitle}` },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={onest.variable} lang="ru">
      <body>
        <LearnerIdentityGate>{children}</LearnerIdentityGate>
        <SiteFooter />
      </body>
    </html>
  );
}
