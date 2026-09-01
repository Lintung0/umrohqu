import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="block leading-none">
      <Image
        width={430}
        height={128}
        alt="UmrahQu"
        src="/logo.svg"
        priority
        className="h-10 w-auto object-contain"
      />
    </Link>
  )
}