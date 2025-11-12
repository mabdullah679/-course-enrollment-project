import React, { createContext, useContext, useState, useCallback } from 'react'

interface NavHintContextValue {
  hints: Record<string, NavHint>
  setHint: (id: string, hint: NavHint | null) => void
}

export interface NavHint {
  label: string
  value: string
}

const NavHintContext = createContext<NavHintContextValue>({
  hints: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setHint: () => {}
})

export const NavHintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hints, setHints] = useState<Record<string, NavHint>>({})

  const setHint = useCallback((id: string, hint: NavHint | null) => {
    setHints(prev => {
      if (!hint) {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: hint }
    })
  }, [])

  return (
    <NavHintContext.Provider value={{ hints, setHint }}>
      {children}
    </NavHintContext.Provider>
  )
}

export const useNavHint = () => useContext(NavHintContext)
