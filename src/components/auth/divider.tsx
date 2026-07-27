interface DividerProps {
  label: string
}

export function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-auth-border" />
      <span className="text-[13.5px] font-medium text-auth-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-auth-border" />
    </div>
  )
}
