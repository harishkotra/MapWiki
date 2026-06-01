"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function NavigationFrame() {
  const pathname = usePathname();
  return (
    <>
      {pathname !== "/" && <TopNav />}
      <ThemeToggle />
    </>
  );
}
