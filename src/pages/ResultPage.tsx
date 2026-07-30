import { AlertCircle, ArrowLeft, ExternalLink, SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { SearchForm } from '../components/SearchForm'
import { StatusBadge } from '../components/StatusBadge'
import { useSemester } from '../context/SemesterContext'
import { courseSemesterLabel } from '../lib/datasets'
import { formatScore } from '../lib/results'
import type { StudentCourseResult } from '../types'

export function ResultPage() {
  const { registration = '' } = useParams()
  const { data, getStudentProfile, pathFor, semesterKey, semesterLabel } = useSemester()
  const profile = getStudentProfile(registration)
  const isCombined = semesterKey === 'combined'
  const scoreLabel = isCombined ? 'Combined CGPA' : 'Semester SGPA'

  if (!profile) {
    return (
      <main className="page-shell page-content">
        <Link to={pathFor()} className="back-link">
          <ArrowLeft size={16} /> Back to search
        </Link>
        <section className="empty-state">
          <SearchX size={36} aria-hidden="true" />
          <h1>No published result found</h1>
          <p>
            Registration <strong className="tabular">{registration}</strong> does not appear in the{' '}
            {semesterLabel.toLowerCase()} dataset.
          </p>
          <SearchForm compact />
        </section>
      </main>
    )
  }

  const { student, courseResults } = profile
  const grouped = isCombined
    ? [
        {
          key: '1-1',
          title: '1-1 semester courses',
          rows: courseResults.filter(({ course }) => course.semesterKey === '1-1'),
        },
        {
          key: '1-2',
          title: '1-2 semester courses',
          rows: courseResults.filter(({ course }) => course.semesterKey === '1-2'),
        },
      ]
    : [{ key: 'all', title: 'Course results', rows: courseResults }]

  return (
    <main className="page-shell page-content">
      <Link to={pathFor()} className="back-link">
        <ArrowLeft size={16} /> Search another registration
      </Link>
      <PageHeader
        eyebrow={isCombined ? 'Combined result' : 'Individual result'}
        title={student.name ?? 'Name unavailable from source'}
        description={`Registration ${student.registration} · ${student.isRegular ? 'Regular 2024 cohort' : `Published ${student.cohort} registration`} · ${semesterLabel}`}
        actions={<StatusBadge status={profile.isComplete ? 'complete' : 'incomplete'} />}
      />

      <section className="result-summary" aria-label="Result summary">
        <div>
          <span>{scoreLabel}</span>
          <strong>{profile.sgpa === null ? '—' : formatScore(profile.sgpa)}</strong>
          <small>
            {profile.sgpa === null
              ? isCombined
                ? 'Requires complete grades in both semesters'
                : 'Requires all valid course grades'
              : `Weighted across ${data.stats.totalCredits.toFixed(1)} credits`}
          </small>
        </div>
        <div>
          <span>Overall rank</span>
          <strong>{profile.overallRank === null ? '—' : `#${profile.overallRank}`}</strong>
          <small>
            {profile.overallRank === null
              ? 'Not eligible for comparable ranking'
              : `Among ${data.stats.eligibleOverallCount} complete records`}
          </small>
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
                : isCombined
                  ? 'One or more course results are missing from either semester.'
                  : 'One or more course results are absent from the supplied sources.'}{' '}
              No {isCombined ? 'CGPA' : 'SGPA'} or overall rank has been inferred.
            </p>
          </div>
        </div>
      )}

      {grouped.map((group) => (
        <CourseResultSection
          key={group.key}
          title={group.title}
          rows={group.rows}
          showSemester={!isCombined}
        />
      ))}
    </main>
  )
}

function CourseResultSection({
  title,
  rows,
  showSemester,
}: {
  title: string
  rows: StudentCourseResult[]
  showSemester: boolean
}) {
  const { data } = useSemester()
  if (rows.length === 0) return null

  return (
    <section className="section-block result-courses">
      <div className="section-heading compact-heading">
        <div>
          <h2>{title}</h2>
          <p>Official and unofficial status follows the supplied source documents.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table result-table">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Credits</th>
              <th scope="col">Grade</th>
              <th scope="col">Point</th>
              <th scope="col">Marks</th>
              <th scope="col">Status</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ course, result }) => {
              const source = result ? data.sources.find((item) => result.sourceIds.includes(item.id)) : null
              return (
                <tr
                  key={course.id}
                  className={!result || result.status === 'conflicted' ? 'row-unresolved' : undefined}
                >
                  <td data-label="Course">
                    <strong>{course.title}</strong>
                    <span>
                      {!showSemester && course.semesterKey ? `${courseSemesterLabel(course)} · ` : ''}
                      {course.code}
                    </span>
                    {result?.note && <span className="result-note">Source note: {result.note}</span>}
                  </td>
                  <td data-label="Credits">{course.credits.toFixed(1)}</td>
                  <td data-label="Grade">
                    <strong className="grade-value">{result?.letterGrade ?? '—'}</strong>
                  </td>
                  <td data-label="Point">
                    {result?.gradePoint === null || !result ? '—' : result.gradePoint.toFixed(2)}
                  </td>
                  <td data-label="Marks">
                    {result?.score === null || !result
                      ? '—'
                      : `${result.score.toFixed(0)} / ${result.maxScore?.toFixed(0) ?? '100'}`}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={result?.status ?? 'incomplete'} />
                  </td>
                  <td data-label="Source">
                    {source ? (
                      <a href={source.url} target="_blank" rel="noreferrer" className="source-link">
                        {source.kind.toUpperCase()} <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="muted">Not published</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
