import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const Logo = ({
  type = "full",
  variant = "dark",
  className,
}: {
  type?: "full" | "icon";
  variant?: "dark" | "light";
  className?: string;
}) => {
  const invertClass = variant === "light" ? "brightness-0 invert" : "";

  if (type === "icon") {
    return (
      <Image
        width={40}
        height={40}
        alt="Logo UmrahQu"
        src="/logo-icon.png"
        className={cn("shrink-0 object-contain", invertClass, className)}
      />
    );
  }

  return (
    <Link href="/" className={cn("block leading-none", className)}>
      <Image
        width={430}
        height={128}
        alt="UmrahQu"
        src="/logo.svg"
        priority
        className={cn("h-10 w-auto object-contain", invertClass)}
      />
    </Link>
  );
};

export default Logo;
