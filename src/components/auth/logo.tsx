"use client"
import Link from "next/link";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Link href="/" className="block leading-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="UmrahQu"
        src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
        className="h-10 w-auto object-contain"
      />
    </Link>
  )
}