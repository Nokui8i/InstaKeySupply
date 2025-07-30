"use client";
import React from "react";
import { AdminAuthProvider } from "./context/AdminAuthContext";

export default function AdminProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
} 