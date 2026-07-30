import { BarChart3, Info } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useSemester } from '../context/SemesterContext'
import { courseSemesterLabel } from '../lib/datasets'
import { formatScore } from '../lib/results'

export function AnalysisPage() {
  const { data, courseAnalytics, semesterKey } = useSemester()
  const [params, setParams] = useSearchParams()
  const requestedCourse = params.get('course')
  const analytics = courseAnalytics.find((item) => item.course.id === requestedCourse) ?? courseAnalytics[0]
  const chartData = analytics.distribution.filter((item) => item.count > 0)
  const isCombined = semesterKey === 'combined'

  return (
    <main className="page-shell page-content">
      <PageHeader
        eyebrow="Published-result analysis"
        title="Course performance"
        description="Explore grade distributions and pass rates across every valid published row. Conflicted grades stay outside the calculations."
      />

      <section className="toolbar" aria-label="Analysis filters">
        <label htmlFor="analysis-course">Course</label>
        <select
          id="analysis-course"
          value={analytics.course.id}
          onChange={(event) => setParams({ course: event.target.value })}
        >
          {data.courses.map((course) => (
            <option key={course.id} value={course.id}>
              {isCombined ? `${courseSemesterLabel(course)} · ` : ''}
              {course.code} · {course.title}
            </option>
          ))}
        </select>
      </section>

      <section className="analysis-summary" aria-label="Selected course summary">
        <div className="analysis-title">
          <BarChart3 size={22} aria-hidden="true" />
          <div>
            <h2>{analytics.course.title}</h2>
            <p>
              {isCombined ? `${courseSemesterLabel(analytics.course)} · ` : ''}
              {analytics.course.code} · {analytics.course.credits.toFixed(1)} credits
            </p>
          </div>
          <StatusBadge status={analytics.course.status} />
        </div>
        <dl>
          <div>
            <dt>Average grade point</dt>
            <dd>{formatScore(analytics.averageGradePoint)}</dd>
          </div>
          <div>
            <dt>Pass rate</dt>
            <dd>{analytics.passRate.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Valid results</dt>
            <dd>{analytics.validCount}</dd>
          </div>
          <div>
            <dt>Unresolved</dt>
            <dd>{analytics.unresolvedCount}</dd>
          </div>
        </dl>
      </section>

      <section className="analysis-grid section-block">
        <div className="chart-panel">
          <div className="section-heading compact-heading">
            <div>
              <h2>Grade distribution</h2>
              <p>Count of valid published grades</p>
            </div>
          </div>
          <div className="chart-wrap" role="img" aria-label={`Grade distribution for ${analytics.course.title}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="grade" tick={{ fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--ink)',
                  }}
                  cursor={{ fill: 'var(--primary-soft)' }}
                />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.grade} fill={entry.grade === 'F' ? 'var(--error)' : 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="distribution-table-panel">
          <div className="section-heading compact-heading">
            <div>
              <h2>Accessible data table</h2>
              <p>The same values without relying on the chart.</p>
            </div>
          </div>
          <table className="compact-table">
            <thead>
              <tr>
                <th scope="col">Grade</th>
                <th scope="col">Students</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {analytics.distribution.map((item) => (
                <tr key={item.grade}>
                  <th scope="row">{item.grade}</th>
                  <td>{item.count}</td>
                  <td>
                    {analytics.validCount ? ((item.count / analytics.validCount) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="notice notice-info">
        <Info size={19} aria-hidden="true" />
        <p>These are descriptive summaries of the supplied result lists, not official university statistics.</p>
      </div>
    </main>
  )
}
