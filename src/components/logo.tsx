import Image from "next/image";
import Link from "next/link";

const Logo = ({ type = "full" }: { type?: "full" | "icon" }) => {
  if (type === "icon") {
    return (
      <Image
        width={52}
        height={52}
        alt="Logo"
        src="/logo-icon.png"
        className="shrink-0"
        style={{ width: "52px", height: "auto" }}
      />
    );
  }
  return (
    <Link href="/" className="block">
      <Image
        width={160}
        height={160}
        alt="Logo"
        src="/logo.png"
        loading="eager"
        style={{ width: "160px", height: "auto" }}
      />
    </Link>
  );
};

export default Logo;
