import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import type { ResultStatus, SourceStatus } from '../types'

export function StatusBadge({ status }: { status: ResultStatus | SourceStatus | 'complete' | 'incomplete' }) {
  const labels = {
    official: 'Official source',
    unofficial: 'Unofficial',
    conflicted: 'Needs review',
    complete: 'Complete',
    incomplete: 'Incomplete',
  }
  const Icon = status === 'official' || status === 'complete' ? CheckCircle2 : status === 'conflicted' ? AlertTriangle : Clock3
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={13} aria-hidden="true" />
      {labels[status]}
    </span>
  )
}
