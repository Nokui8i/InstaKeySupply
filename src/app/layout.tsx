import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import NavBar from "./components/NavBar";

import ClientLayout from './client-layout';

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InstaKeySupply - Premium Key Fobs & Accessories",
  description: "Your trusted source for high-quality key fobs, remotes, and automotive accessories. Fast shipping and expert support.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
      { url: '/favicons/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicons/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/Untitled design.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "InstaKeySupply - Premium Key Fobs & Accessories",
    description: "Your trusted source for high-quality key fobs, remotes, and automotive accessories.",
    images: ['/Untitled design.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "InstaKeySupply - Premium Key Fobs & Accessories",
    description: "Your trusted source for high-quality key fobs, remotes, and automotive accessories.",
    images: ['/Untitled design.png'],
  },
  other: {
    'msapplication-TileColor': '#000000',
    'msapplication-TileImage': '/Untitled design.png',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#000000',
    'msapplication-navbutton-color': '#000000',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'InstaKeySupply',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  console.log('RootLayout rendered on client');
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/Untitled design.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/Untitled design.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 min-h-screen transition-colors duration-500 overflow-x-hidden`}
        style={{ backgroundAttachment: 'fixed', maxWidth: '100vw', width: '100%' }}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
