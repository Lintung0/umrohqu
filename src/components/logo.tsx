import Image from "next/image";
import Link from "next/link";

const Logo = ({
  type = "full",
  variant = "dark",
}: {
  type?: "full" | "icon";
  variant?: "dark" | "light";
}) => {
  if (type === "icon") {
    return (
      <Image
        width={48}
        height={48}
        alt="Logo UmrahQu"
        src="/logo-icon.png"
        className="shrink-0 object-contain"
        style={{ width: "48px", height: "auto" }}
      />
    );
  }
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <Image
        width={44}
        height={44}
        alt="Logo UmrahQu"
        src="/logo-icon.png"
        className="shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
        style={{ width: "44px", height: "auto" }}
      />
      <span
        className={`text-[22px] sm:text-2xl font-extrabold tracking-tight leading-none bg-clip-text text-transparent drop-shadow-sm ${
          variant === "light"
            ? "bg-gradient-to-r from-white via-amber-50 to-amber-200"
            : "bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500"
        }`}
      >
        Umrah<span className={variant === "light" ? "text-amber-300" : "text-amber-500"}>Qu</span>
      </span>
    </Link>
  );
};

export default Logo;
