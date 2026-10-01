import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // undefined = belum tahu (render pertama SAMA dengan server → tanpa mismatch).
  // Nilai asli diisi di effect setelah mount, lalu mengikuti resize.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile ?? false
}
