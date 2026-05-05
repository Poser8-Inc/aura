import { create } from 'zustand'

export interface AppState {
  readingsUsed: number
  incrementReadings: () => void
  setReadingsUsed: (n: number) => void
}

export const useStore = create<AppState>((set) => ({
  readingsUsed: 0,
  incrementReadings: () => set((s) => ({ readingsUsed: s.readingsUsed + 1 })),
  setReadingsUsed: (n) => set({ readingsUsed: n }),
}))
