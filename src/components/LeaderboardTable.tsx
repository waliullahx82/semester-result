import { Link } from 'react-router-dom'
import { formatScore } from '../lib/results'
import type { RankedEntry } from '../types'

export function LeaderboardTable({ entries, mode }: { entries: RankedEntry[]; mode: 'overall' | 'course' }) {
  return (
    <div className="table-scroll">
      <table className="data-table leaderboard-table">
        <caption className="sr-only">
          {mode === 'overall' ? 'Complete regular semester leaderboard' : 'Course leaderboard'}
        </caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Student</th>
            <th scope="col">Registration</th>
            <th scope="col">{mode === 'overall' ? 'SGPA' : 'Grade point'}</th>
            {mode === 'overall' && <th scope="col">Credits</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.registration}>
              <td data-label="Rank">
                <span className={entry.rank <= 3 ? 'rank-chip rank-top' : 'rank-chip'}>#{entry.rank}</span>
              </td>
              <td data-label="Student">{entry.name ?? 'Name unavailable from source'}</td>
              <td data-label="Registration">
                <Link to={`/result/${entry.registration}`} className="registration-link">
                  {entry.registration}
                </Link>
              </td>
              <td data-label={mode === 'overall' ? 'SGPA' : 'Grade point'}>
                <strong className="tabular">{formatScore(entry.score)}</strong>
              </td>
              {mode === 'overall' && <td data-label="Credits">{entry.totalCredits.toFixed(1)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
