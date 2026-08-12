"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Package } from "@/lib/types"

const COMPARE_KEY = "umrohqu_compare"
const MAX_COMPARE = 3

interface CompareContextValue {
  comparePackages: Package[]
  compareCount: number
  addToCompare: (pkg: Package) => boolean
  removeFromCompare: (id: string) => void
  clearCompare: () => void
  isSelected: (id: string) => boolean
  isFull: boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

function loadCompare(): Package[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(COMPARE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : []
  } catch {
    return []
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [comparePackages, setComparePackages] = useState<Package[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setComparePackages(loadCompare())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(COMPARE_KEY, JSON.stringify(comparePackages))
  }, [comparePackages, hydrated])

  const addToCompare = useCallback((pkg: Package): boolean => {
    let added = false
    setComparePackages((prev) => {
      if (prev.find((p) => p.id === pkg.id)) return prev
      if (prev.length >= MAX_COMPARE) return prev
      added = true
      return [...prev, pkg]
    })
    return added
  }, [])

  const removeFromCompare = useCallback((id: string) => {
    setComparePackages((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearCompare = useCallback(() => {
    setComparePackages([])
  }, [])

  const isSelected = useCallback((id: string) => {
    return comparePackages.some((p) => p.id === id)
  }, [comparePackages])

  return (
    <CompareContext.Provider
      value={{
        comparePackages,
        compareCount: comparePackages.length,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isSelected,
        isFull: comparePackages.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext)
  if (!ctx) {
    return {
      comparePackages: [],
      compareCount: 0,
      addToCompare: () => false,
      removeFromCompare: () => {},
      clearCompare: () => {},
      isSelected: () => false,
      isFull: false,
    }
  }
  return ctx
}

export { MAX_COMPARE }
