import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="page-shell page-content">
      <section className="empty-state">
        <Compass size={36} aria-hidden="true" />
        <h1>That page is not in this result set.</h1>
        <p>Return to the result search or choose a section from the navigation.</p>
        <Link to="/" className="button">Return home</Link>
      </section>
    </main>
  )
}
