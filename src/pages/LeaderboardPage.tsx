import { Info } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { PageHeader } from '../components/PageHeader'
import { useSemester } from '../context/SemesterContext'
import { courseSemesterLabel } from '../lib/datasets'

export function LeaderboardPage() {
  const { data, overallLeaderboard, buildCourseLeaderboard, semesterKey, semesterLabel } = useSemester()
  const [params, setParams] = useSearchParams()
  const mode = params.get('course') ?? 'overall'
  const selectedCourse = data.courses.find((course) => course.id === mode)
  const entries = useMemo(
    () => (selectedCourse ? buildCourseLeaderboard(selectedCourse.id) : overallLeaderboard),
    [selectedCourse, buildCourseLeaderboard, overallLeaderboard],
  )
  const isCombined = semesterKey === 'combined'
  const scoreLabel = selectedCourse ? 'Grade point' : isCombined ? 'CGPA' : 'SGPA'

  return (
    <main className="page-shell page-content">
      <PageHeader
        eyebrow="Fair comparisons"
        title="Leaderboard"
        description={
          isCombined
            ? 'Combined rank is reserved for regular students complete in both 1-1 and 1-2. Course ranks include every valid published registration.'
            : `Overall rank is reserved for complete regular ${semesterLabel.toLowerCase()} records. Course ranks include every valid published registration.`
        }
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
          <option value="overall">
            {isCombined ? 'Combined CGPA' : 'Overall semester SGPA'}
          </option>
          {data.courses.map((course) => (
            <option key={course.id} value={course.id}>
              {isCombined ? `${courseSemesterLabel(course)} · ` : ''}
              {course.code} · {course.title}
            </option>
          ))}
        </select>
        <span className="toolbar-count">{entries.length} ranked records</span>
      </section>

      <div className="notice notice-info">
        <Info size={19} aria-hidden="true" />
        <p>
          Equal scores share competition rank. Missing results are never treated as zero
          {semesterKey === '1-2' || isCombined
            ? ', and conflicted 1-2 grades stay excluded from overall ranking.'
            : '.'}
        </p>
      </div>

      <section className="section-block">
        <div className="section-heading compact-heading">
          <div>
            <h2>{selectedCourse ? selectedCourse.title : isCombined ? 'Complete combined records' : 'Complete semester records'}</h2>
            <p>
              {selectedCourse
                ? `${isCombined ? `${courseSemesterLabel(selectedCourse)} · ` : ''}${selectedCourse.code} · ${selectedCourse.credits.toFixed(1)} credits`
                : `${data.stats.totalCredits.toFixed(1)} weighted credits · regular 202433 cohort`}
            </p>
          </div>
        </div>
        <LeaderboardTable
          entries={entries}
          mode={selectedCourse ? 'course' : 'overall'}
          scoreLabel={scoreLabel}
        />
      </section>
    </main>
  )
}
