import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { SemesterProvider } from './context/SemesterContext'
import { DEFAULT_SEMESTER, isSemesterKey } from './lib/datasets'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResultPage } from './pages/ResultPage'
import { SourcesPage } from './pages/SourcesPage'

const AnalysisPage = lazy(() =>
  import('./pages/AnalysisPage').then((module) => ({ default: module.AnalysisPage })),
)

function SemesterGate({ children }: { children: ReactNode }) {
  const { semester } = useParams()
  if (!isSemesterKey(semester)) {
    return <Navigate to={`/${DEFAULT_SEMESTER}`} replace />
  }
  return <SemesterProvider>{children}</SemesterProvider>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${DEFAULT_SEMESTER}`} replace />} />
      <Route path="/result/:registration" element={<LegacyResultRedirect />} />
      <Route path="/leaderboard" element={<Navigate to={`/${DEFAULT_SEMESTER}/leaderboard`} replace />} />
      <Route path="/analysis" element={<Navigate to={`/${DEFAULT_SEMESTER}/analysis`} replace />} />
      <Route path="/sources" element={<Navigate to={`/${DEFAULT_SEMESTER}/sources`} replace />} />
      <Route path="/results" element={<Navigate to={`/${DEFAULT_SEMESTER}`} replace />} />

      <Route
        path="/:semester"
        element={
          <SemesterGate>
            <AppShell />
          </SemesterGate>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<RouteFallback />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="result/:registration"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ResultPage />
            </Suspense>
          }
        />
        <Route
          path="leaderboard"
          element={
            <Suspense fallback={<RouteFallback />}>
              <LeaderboardPage />
            </Suspense>
          }
        />
        <Route
          path="analysis"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AnalysisPage />
            </Suspense>
          }
        />
        <Route
          path="sources"
          element={
            <Suspense fallback={<RouteFallback />}>
              <SourcesPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function LegacyResultRedirect() {
  const { registration } = useParams()
  return <Navigate to={`/${DEFAULT_SEMESTER}/result/${registration}`} replace />
}

function RouteFallback() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="Loading page">
      <div className="route-skeleton" />
      <div className="route-skeleton route-skeleton-short" />
    </main>
  )
}
