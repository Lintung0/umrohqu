"use client"
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const Logo = ({
  type = "full",
  variant,
  className,
}: {
  type?: "full" | "icon";
  variant?: "dark" | "light";
  className?: string;
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = variant === "light" || resolvedTheme === "dark";

  if (type === "icon") {
    return (
      <img
        width={40}
        height={40}
        alt="Logo UmrahQu"
        src="/logo-icon.svg"
        className={cn("shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <Link href="/" className={cn("block leading-none", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="UmrahQu"
        src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
        className="h-6 sm:h-8 w-auto object-contain"
      />
    </Link>
  );
};

export default Logo;