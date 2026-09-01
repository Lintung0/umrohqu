import Image from "next/image";
import Link from "next/link";

const Logo = ({
  type = "full",
  variant = "dark",
}: {
  type?: "full" | "icon";
  variant?: "dark" | "light";
}) => {
  const circleClass =
    variant === "light"
      ? "bg-white/10 ring-white/20"
      : "bg-gradient-to-br from-emerald-600 to-emerald-700 ring-emerald-100 shadow-sm";

  const badge = (
    <span className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring transition-colors ${circleClass}`}>
      <Image
        width={44}
        height={44}
        alt="Logo UmrahQu"
        src="/logo-icon.png"
        className="shrink-0 object-contain brightness-0 invert"
        style={{ width: "82%", height: "auto" }}
      />
    </span>
  );

  if (type === "icon") {
    return badge;
  }
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      {badge}
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
