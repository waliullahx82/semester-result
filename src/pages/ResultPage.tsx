import { AlertCircle, ArrowLeft, ExternalLink, SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { SearchForm } from '../components/SearchForm'
import { StatusBadge } from '../components/StatusBadge'
import { data, formatScore, getStudentProfile } from '../lib/results'

export function ResultPage() {
  const { registration = '' } = useParams()
  const profile = getStudentProfile(registration)

  if (!profile) {
    return (
      <main className="page-shell page-content">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to search</Link>
        <section className="empty-state">
          <SearchX size={36} aria-hidden="true" />
          <h1>No published result found</h1>
          <p>Registration <strong className="tabular">{registration}</strong> does not appear in any supplied result PDF.</p>
          <SearchForm compact />
        </section>
      </main>
    )
  }

  const { student, courseResults } = profile
  return (
    <main className="page-shell page-content">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Search another registration</Link>
      <PageHeader
        eyebrow="Individual result"
        title={student.name ?? 'Name unavailable from source'}
        description={`Registration ${student.registration} · ${student.isRegular ? 'Regular 2024 cohort' : `Published ${student.cohort} registration`}`}
        actions={<StatusBadge status={profile.isComplete ? 'complete' : 'incomplete'} />}
      />

      <section className="result-summary" aria-label="Result summary">
        <div>
          <span>Semester SGPA</span>
          <strong>{profile.sgpa === null ? '—' : formatScore(profile.sgpa)}</strong>
          <small>{profile.sgpa === null ? 'Requires all valid course grades' : `Weighted across ${data.stats.totalCredits.toFixed(1)} credits`}</small>
        </div>
        <div>
          <span>Overall rank</span>
          <strong>{profile.overallRank === null ? '—' : `#${profile.overallRank}`}</strong>
          <small>{profile.overallRank === null ? 'Not eligible for comparable ranking' : `Among ${data.stats.eligibleOverallCount} complete records`}</small>
        </div>
        <div>
          <span>Completed credits</span>
          <strong>{profile.completedCredits.toFixed(1)}</strong>
          <small>of {data.stats.totalCredits.toFixed(1)} published credits</small>
        </div>
      </section>

      {!profile.isComplete && (
        <div className="notice notice-warning" role="status">
          <AlertCircle size={20} aria-hidden="true" />
          <div>
            <strong>This record is not comparable yet.</strong>
            <p>
              {profile.unresolvedCount
                ? `${profile.unresolvedCount} grade has conflicting source values and remains unresolved.`
                : 'One or more course results are absent from the supplied PDFs.'}{' '}
              No SGPA or overall rank has been inferred.
            </p>
          </div>
        </div>
      )}

      <section className="section-block result-courses">
        <div className="section-heading compact-heading">
          <div><h2>Course results</h2><p>Official and unofficial status follows the supplied source documents.</p></div>
        </div>
        <div className="table-scroll">
          <table className="data-table result-table">
            <caption className="sr-only">Course-by-course result for {student.registration}</caption>
            <thead><tr><th scope="col">Course</th><th scope="col">Credits</th><th scope="col">Grade</th><th scope="col">Point</th><th scope="col">Marks</th><th scope="col">Status</th><th scope="col">Source</th></tr></thead>
            <tbody>
              {courseResults.map(({ course, result }) => {
                const source = result ? data.sources.find((item) => result.sourceIds.includes(item.id)) : null
                return (
                  <tr key={course.id} className={!result || result.status === 'conflicted' ? 'row-unresolved' : undefined}>
                    <td data-label="Course"><strong>{course.title}</strong><span>{course.code}</span>{result?.note && <span className="result-note">Source note: {result.note}</span>}</td>
                    <td data-label="Credits">{course.credits.toFixed(1)}</td>
                    <td data-label="Grade"><strong className="grade-value">{result?.letterGrade ?? '—'}</strong></td>
                    <td data-label="Point">{result?.gradePoint === null || !result ? '—' : result.gradePoint.toFixed(2)}</td>
                    <td data-label="Marks">{result?.score === null || !result ? '—' : `${result.score.toFixed(0)} / ${result.maxScore?.toFixed(0) ?? '100'}`}</td>
                    <td data-label="Status"><StatusBadge status={result?.status ?? 'incomplete'} /></td>
                    <td data-label="Source">
                      {source ? <a href={source.url} target="_blank" rel="noreferrer" className="source-link">{source.kind.toUpperCase()} <ExternalLink size={14} /></a> : <span className="muted">Not published</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
