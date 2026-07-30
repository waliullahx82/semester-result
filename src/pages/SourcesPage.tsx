import { AlertTriangle, Download, FileText, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { data } from '../lib/results'

export function SourcesPage() {
  return (
    <main className="page-shell page-content">
      <PageHeader
        eyebrow="Evidence and provenance"
        title="Source documents"
        description="Every displayed result came from these supplied PDFs and CSV. Original files are preserved for independent verification."
      />

      <section className="source-audit" aria-label="Validation summary">
        <ShieldCheck size={25} aria-hidden="true" />
        <div><strong>All {data.stats.sourceCount} configured source files passed structural validation.</strong><p>Every PDF page and CSV row was parsed; unexpected duplicates or grade-point mismatches stop data generation.</p></div>
      </section>

      <section className="section-block">
        <div className="source-list">
          {data.sources.map((source) => {
            const course = data.courses.find((item) => item.id === source.courseId)!
            return (
              <article className="source-row" key={source.id}>
                <span className="source-file-icon" aria-hidden="true"><FileText size={20} /></span>
                <div className="source-main">
                  <div className="source-heading"><strong>{course.title}</strong><StatusBadge status={source.status} /></div>
                  <p>{source.fileName}</p>
                  <span>{course.code} · {source.pageCount === null ? 'CSV source' : `${source.pageCount} pages`} · {source.rowCount} registrations{source.printedSession ? ` · Printed session ${source.printedSession}` : ''}</span>
                  {source.notes.map((note) => <p className="source-note" key={note}><AlertTriangle size={14} /> {note}</p>)}
                </div>
                <a href={source.url} target="_blank" rel="noreferrer" className="button button-secondary">
                  <Download size={16} aria-hidden="true" /> Open {source.kind.toUpperCase()}
                </a>
              </article>
            )
          })}
        </div>
      </section>

      <section className="issues-panel">
        <div className="section-heading compact-heading"><div><h2>Reviewed data warnings</h2><p>Known uncertainty is retained rather than silently corrected.</p></div></div>
        <ul>
          {data.issues.map((issue) => <li key={issue.id}><AlertTriangle size={17} aria-hidden="true" /><div><strong>{issue.type.replaceAll('-', ' ')}</strong><p>{issue.message}{issue.registration ? ` Registration ${issue.registration}.` : ''}</p></div></li>)}
        </ul>
      </section>
    </main>
  )
}
