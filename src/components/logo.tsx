"use client"
import Image from "next/image";
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
  const isDark = resolvedTheme === "dark" || variant === "light";

  if (type === "icon") {
    return (
      <Image
        width={40}
        height={40}
        alt="Logo UmrahQu"
        src="/logo-icon.png"
        className={cn("shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <Link href="/" className={cn("block leading-none", className)}>
      <Image
        width={2560}
        height={1498}
        alt="UmrahQu"
        src={isDark ? "/newlogodark.jpg" : "/newlogolight.jpg"}
        priority
        className={cn("h-9 sm:h-10 w-auto object-contain")}
      />
    </Link>
  );
};

export default Logo;