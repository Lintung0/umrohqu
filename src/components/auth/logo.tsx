"use client"
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Link href="/" className="block leading-none">
      <Image
        width={2560}
        height={1498}
        alt="UmrahQu"
        src={isDark ? "/newlogodark.jpg" : "/newlogolight.jpg"}
        priority
        className="h-10 w-auto object-contain"
      />
    </Link>
  )
}