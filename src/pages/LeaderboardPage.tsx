import { Info } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { PageHeader } from '../components/PageHeader'
import { buildCourseLeaderboard, data, overallLeaderboard } from '../lib/results'

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('course') ?? 'overall'
  const selectedCourse = data.courses.find((course) => course.id === mode)
  const entries = useMemo(
    () => (selectedCourse ? buildCourseLeaderboard(selectedCourse.id) : overallLeaderboard),
    [selectedCourse],
  )

  return (
    <main className="page-shell page-content">
      <PageHeader
        eyebrow="Fair comparisons"
        title="Leaderboard"
        description="Overall rank is reserved for complete regular-semester records. Course ranks include every valid published registration."
      />

      <section className="toolbar" aria-label="Leaderboard filters">
        <label htmlFor="ranking-mode">Ranking view</label>
        <select
          id="ranking-mode"
          value={selectedCourse?.id ?? 'overall'}
          onChange={(event) => {
            const value = event.target.value
            setParams(value === 'overall' ? {} : { course: value })
          }}
        >
          <option value="overall">Overall semester SGPA</option>
          {data.courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}
        </select>
        <span className="toolbar-count">{entries.length} ranked records</span>
      </section>

      <div className="notice notice-info">
        <Info size={19} aria-hidden="true" />
        <p>
          Equal scores share competition rank. The EEE lab conflict is excluded, and absent results are never treated as zero.
        </p>
      </div>

      <section className="section-block">
        <div className="section-heading compact-heading">
          <div>
            <h2>{selectedCourse ? selectedCourse.title : 'Complete semester records'}</h2>
            <p>{selectedCourse ? `${selectedCourse.code} · ${selectedCourse.credits.toFixed(1)} credits` : `${data.stats.totalCredits.toFixed(1)} weighted credits · regular 202433 cohort`}</p>
          </div>
        </div>
        <LeaderboardTable entries={entries} mode={selectedCourse ? 'course' : 'overall'} />
      </section>
    </main>
  )
}
