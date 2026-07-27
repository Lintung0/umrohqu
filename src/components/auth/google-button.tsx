"use client"

import { useState } from "react"

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] bg-white text-[15.5px] font-semibold text-auth-secondary-foreground transition-[border-color,background] duration-150"
      style={{
        borderColor: hovered ? "#2A7D4F" : "#DDE8E2",
        background: hovered ? "#F3FAF6" : "white",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.39a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 3-4.33 3-7.32z" fill="#4285F4" />
        <path d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.24-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.75-5.59-4.12H1.06v2.58A10 10 0 0 0 10 20z" fill="#34A853" />
        <path d="M4.41 11.9A6 6 0 0 1 4.1 10c0-.66.11-1.3.31-1.9V5.52H1.06A10 10 0 0 0 0 10c0 1.61.39 3.14 1.06 4.48l3.35-2.58z" fill="#FBBC05" />
        <path d="M10 3.96a5.4 5.4 0 0 1 3.82 1.49l2.85-2.85A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.06 5.52L4.41 8.1C5.2 5.71 7.4 3.96 10 3.96z" fill="#EA4335" />
      </svg>
      Lanjutkan dengan Google
    </button>
  )
}
