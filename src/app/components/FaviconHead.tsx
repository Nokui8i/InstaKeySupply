'use client';

import Head from 'next/head';

export default function FaviconHead() {
  return (
    <Head>
      {/* Primary favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/Untitled design.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/Untitled design.png" />
      
      {/* Apple Touch Icons for iOS devices */}
      <link rel="apple-touch-icon" sizes="180x180" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="114x114" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="60x60" href="/Untitled design.png" />
      <link rel="apple-touch-icon" sizes="57x57" href="/Untitled design.png" />
      
      {/* Android Chrome Icons */}
      <link rel="icon" type="image/png" sizes="192x192" href="/Untitled design.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/Untitled design.png" />
      
      {/* Microsoft Tiles for Windows */}
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-TileImage" content="/Untitled design.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Web App Manifest for PWA */}
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-navbutton-color" content="#000000" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Additional mobile optimizations */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="InstaKeySupply" />
      
      {/* Preload favicon for faster loading */}
      <link rel="preload" href="/Untitled design.png" as="image" type="image/png" />
    </Head>
  );
}
