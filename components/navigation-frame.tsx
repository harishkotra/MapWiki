"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/top-nav";

export function NavigationFrame() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <TopNav />;
}

