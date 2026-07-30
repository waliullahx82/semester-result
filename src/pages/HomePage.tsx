import { AlertTriangle, ArrowRight, BookOpenCheck, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { SearchForm } from '../components/SearchForm'
import { StatusBadge } from '../components/StatusBadge'
import { courseAnalytics, data, formatScore, overallLeaderboard } from '../lib/results'

export function HomePage() {
  const strongestCourse = [...courseAnalytics].sort((a, b) => b.averageGradePoint - a.averageGradePoint)[0]

  return (
    <main>
      <section className="home-hero">
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Session {data.semester.session} · July-December</p>
            <h1>Your 1-2 result, without the PDF hunt.</h1>
            <p className="hero-lead">
              Search an individual registration, compare complete semester records, and trace every grade back to its published source.
            </p>
            <SearchForm />
          </div>
          <aside className="trust-panel" aria-label="Data status">
            <div className="trust-panel-heading">
              <ShieldCheck size={22} aria-hidden="true" />
              <div>
                <strong>Source-linked data</strong>
                <span>Validated from every source row and PDF page</span>
              </div>
            </div>
            <dl>
              <div><dt>Source documents</dt><dd>{data.stats.sourceCount}</dd></div>
              <div><dt>Courses</dt><dd>{data.stats.courseCount}</dd></div>
              <div><dt>Official-course cohort</dt><dd>{data.stats.officialRegularStudentCount}</dd></div>
              <div><dt>Comparable records</dt><dd>{data.stats.eligibleOverallCount}</dd></div>
            </dl>
            <p className="trust-note">
              <AlertTriangle size={16} aria-hidden="true" />
              The EEE lab result is unofficial and one grade conflict remains unresolved.
            </p>
            <Link to="/sources">Review source status <ArrowRight size={15} /></Link>
          </aside>
        </div>
      </section>

      <section className="stats-band" aria-label="Semester overview">
        <div className="page-shell stats-band-inner">
          <div><span>Total credits</span><strong>{data.stats.totalCredits.toFixed(1)}</strong></div>
          <div><span>Official sources</span><strong>{data.stats.officialSourceCount} / {data.stats.sourceCount}</strong></div>
          <div><span>Complete regular records</span><strong>{data.stats.eligibleOverallCount}</strong></div>
          <div><span>Highest course average</span><strong>{formatScore(strongestCourse.averageGradePoint)}</strong><small>{strongestCourse.course.code}</small></div>
        </div>
      </section>

      <section className="page-shell section-block">
        <div className="section-heading">
          <div>
            <h2>Current leaders</h2>
            <p>Only complete, conflict-free regular records receive an overall rank.</p>
          </div>
          <Link to="/leaderboard" className="text-link">View full leaderboard <ArrowRight size={16} /></Link>
        </div>
        <LeaderboardTable entries={overallLeaderboard.slice(0, 5)} mode="overall" />
      </section>

      <section className="page-shell section-block course-overview">
        <div className="section-heading">
          <div>
            <h2>Nine courses, one semester view</h2>
          </div>
          <Link to="/analysis" className="text-link">Explore analysis <ArrowRight size={16} /></Link>
        </div>
        <div className="course-list">
          {data.courses.map((course) => {
            const analytics = courseAnalytics.find((item) => item.course.id === course.id)!
            return (
              <article className="course-row" key={course.id}>
                <span className="course-icon" aria-hidden="true"><BookOpenCheck size={18} /></span>
                <div className="course-row-main">
                  <strong>{course.title}</strong>
                  <span>{course.code} · {course.credits.toFixed(1)} credits</span>
                </div>
                <StatusBadge status={course.status} />
                <div className="course-average">
                  <span>Average</span>
                  <strong>{formatScore(analytics.averageGradePoint)}</strong>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
