import { AlertTriangle, Download, FileText, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useSemester } from '../context/SemesterContext'
import { courseSemesterLabel } from '../lib/datasets'

export function SourcesPage() {
  const { data, semesterKey, semesterLabel } = useSemester()
  const isCombined = semesterKey === 'combined'

  return (
    <main className="page-shell page-content">
      <PageHeader
        eyebrow="Evidence and provenance"
        title="Source documents"
        description={
          isCombined
            ? 'Combined view includes every 1-1 and 1-2 source used by the explorer.'
            : `Every displayed ${semesterLabel.toLowerCase()} result came from these supplied files. Original files are preserved for independent verification.`
        }
      />

      <section className="source-audit" aria-label="Validation summary">
        <ShieldCheck size={25} aria-hidden="true" />
        <div>
          <strong>
            {data.stats.sourceCount} source file{data.stats.sourceCount === 1 ? '' : 's'} power this view.
          </strong>
          <p>
            {semesterKey === '1-1'
              ? '1-1 grades were imported from the compiled spreadsheet and mapped into the explorer schema.'
              : 'Every PDF page and CSV row was parsed; unexpected duplicates or grade-point mismatches stop data generation.'}
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="source-list">
          {data.sources.map((source) => {
            const course = data.courses.find((item) => item.id === source.courseId)
            return (
              <article className="source-row" key={source.id}>
                <span className="source-file-icon" aria-hidden="true">
                  <FileText size={20} />
                </span>
                <div className="source-main">
                  <div className="source-heading">
                    <strong>{course?.title ?? source.fileName}</strong>
                    <StatusBadge status={source.status} />
                  </div>
                  <p>{source.fileName}</p>
                  <span>
                    {course
                      ? `${isCombined && course.semesterKey ? `${courseSemesterLabel(course)} · ` : ''}${course.code} · `
                      : ''}
                    {source.pageCount === null
                      ? source.kind === 'xlsx'
                        ? 'Excel source'
                        : 'CSV source'
                      : `${source.pageCount} pages`}{' '}
                    · {source.rowCount} registrations
                    {source.printedSession ? ` · Printed session ${source.printedSession}` : ''}
                  </span>
                  {source.notes.map((note) => (
                    <p className="source-note" key={note}>
                      <AlertTriangle size={14} /> {note}
                    </p>
                  ))}
                </div>
                <a href={source.url} target="_blank" rel="noreferrer" className="button button-secondary">
                  <Download size={16} aria-hidden="true" /> Open {source.kind.toUpperCase()}
                </a>
              </article>
            )
          })}
        </div>
      </section>

      {data.issues.length > 0 && (
        <section className="issues-panel">
          <div className="section-heading compact-heading">
            <div>
              <h2>Reviewed data warnings</h2>
              <p>Known uncertainty is retained rather than silently corrected.</p>
            </div>
          </div>
          <ul>
            {data.issues.map((issue) => (
              <li key={issue.id}>
                <AlertTriangle size={17} aria-hidden="true" />
                <div>
                  <strong>{issue.type.replaceAll('-', ' ')}</strong>
                  <p>
                    {issue.message}
                    {issue.registration ? ` Registration ${issue.registration}.` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
