"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Package } from "@/lib/types"

const STORAGE_KEY = "umrohqu_compare"
const MAX_COMPARE = 3

interface CompareContextValue {
  packages: Package[]
  count: number
  addPackage: (pkg: Package) => void
  removePackage: (id: string) => void
  clearPackages: () => void
  isSelected: (id: string) => boolean
  isFull: boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

function loadFromStorage(): Package[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : []
  } catch {
    return []
  }
}

function saveToStorage(pkgs: Package[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pkgs))
  } catch {}
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [packages, setPackages] = useState<Package[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPackages(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(packages)
  }, [packages, hydrated])

  const addPackage = useCallback((pkg: Package) => {
    setPackages((prev) => {
      if (prev.find((p) => p.id === pkg.id)) return prev
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, pkg]
    })
  }, [])

  const removePackage = useCallback((id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearPackages = useCallback(() => {
    setPackages([])
  }, [])

  const isSelected = useCallback((id: string) => {
    return packages.some((p) => p.id === id)
  }, [packages])

  return (
    <CompareContext.Provider
      value={{
        packages,
        count: packages.length,
        addPackage,
        removePackage,
        clearPackages,
        isSelected,
        isFull: packages.length >= MAX_COMPARE,
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
      packages: [],
      count: 0,
      addPackage: () => {},
      removePackage: () => {},
      clearPackages: () => {},
      isSelected: () => false,
      isFull: false,
    }
  }
  return ctx
}

export { MAX_COMPARE }
