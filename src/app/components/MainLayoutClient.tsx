"use client";
import React from "react";
import NavBar from "./NavBar";

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="min-h-[calc(100vh-64px)] pt-2 sm:pt-6 transition-all duration-500">{children}</main>
    </>
  );
} 