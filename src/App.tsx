import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResultPage } from './pages/ResultPage'
import { SourcesPage } from './pages/SourcesPage'

const AnalysisPage = lazy(() =>
  import('./pages/AnalysisPage').then((module) => ({ default: module.AnalysisPage })),
)

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:registration" element={<ResultPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/results" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

function RouteFallback() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="Loading page">
      <div className="route-skeleton" />
      <div className="route-skeleton route-skeleton-short" />
    </main>
  )
}
