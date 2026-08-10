export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-auth-primary">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="4" y="9" width="14" height="10" rx="2" fill="white" opacity="0.9" />
          <rect x="8" y="12" width="6" height="7" rx="1" fill="#2A7D4F" />
          <path d="M11 3C8.5 3 6.5 4.8 6.5 7C6.5 5.5 8.5 4.5 11 4.5C13.5 4.5 15.5 5.5 15.5 7C15.5 4.8 13.5 3 11 3Z" fill="white" opacity="0.85" />
        </svg>
      </div>
      <span className="text-[22px] font-bold tracking-tight text-auth-primary">
        UmrahQu
      </span>
    </div>
  )
}
