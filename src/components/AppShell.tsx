import { BarChart3, FileCheck2, GraduationCap, ListOrdered, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Find result', icon: Search, end: true },
  { to: '/leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { to: '/analysis', label: 'Analysis', icon: BarChart3 },
  { to: '/sources', label: 'Sources', icon: FileCheck2 },
]

function getInitialTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function AppShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('result-theme', theme)
  }, [theme])

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="CSE 1-2 Result Explorer home">
            <span className="brand-mark" aria-hidden="true">
              <GraduationCap size={20} strokeWidth={2.2} />
            </span>
            <span>
              <strong>Result Explorer</strong>
              <small>CSE · 1-2 Semester</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="icon-button"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>

      <div id="main-content">{children}</div>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            Independent student-built explorer. Not an official SUST result publication.
          </p>
          <Link to="/sources">Verify every result against its source</Link>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={19} aria-hidden="true" />
            <span>{label.replace(' result', '')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
