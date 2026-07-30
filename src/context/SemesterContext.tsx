import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { DEFAULT_SEMESTER, getSemesterLabel, isSemesterKey, SEMESTER_OPTIONS } from '../lib/datasets'
import { resultsBySemester, type ResultsApi } from '../lib/results'
import type { SemesterKey, SemesterOption } from '../types'

interface SemesterContextValue extends ResultsApi {
  semesterKey: SemesterKey
  semesterOptions: SemesterOption[]
  semesterLabel: string
  pathFor: (path?: string) => string
}

const SemesterContext = createContext<SemesterContextValue | null>(null)

export function SemesterProvider({ children }: { children: ReactNode }) {
  const { semester } = useParams()
  const semesterKey: SemesterKey = isSemesterKey(semester) ? semester : DEFAULT_SEMESTER
  const api = resultsBySemester[semesterKey]

  const value = useMemo<SemesterContextValue>(
    () => ({
      ...api,
      semesterKey,
      semesterOptions: SEMESTER_OPTIONS,
      semesterLabel: getSemesterLabel(semesterKey),
      pathFor: (path = '') => {
        const normalized = path.startsWith('/') ? path.slice(1) : path
        return normalized ? `/${semesterKey}/${normalized}` : `/${semesterKey}`
      },
    }),
    [api, semesterKey],
  )

  return <SemesterContext.Provider value={value}>{children}</SemesterContext.Provider>
}

export function useSemester(): SemesterContextValue {
  const context = useContext(SemesterContext)
  if (!context) {
    throw new Error('useSemester must be used within SemesterProvider')
  }
  return context
}
