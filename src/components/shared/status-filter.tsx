"use client"

interface StatusFilterProps {
  statuses: readonly { value: string; label: string; color: string }[]
  value: string
  onChange: (value: string) => void
}

export default function StatusFilter({ statuses, value, onChange }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            value === status.value
              ? "bg-emerald-600 text-white"
              : `${status.color} hover:opacity-80`
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  )
}
