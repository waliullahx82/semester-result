import { BarChart3, FileCheck2, GraduationCap, ListOrdered, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSemester } from '../context/SemesterContext'
import type { SemesterKey } from '../types'

const navigation = [
  { to: '', label: 'Find result', icon: Search, end: true },
  { to: 'leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { to: 'analysis', label: 'Analysis', icon: BarChart3 },
  { to: 'sources', label: 'Sources', icon: FileCheck2 },
]

function getInitialTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function switchSemesterPath(pathname: string, nextSemester: SemesterKey): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return `/${nextSemester}`
  const rest = segments.slice(1)
  return rest.length ? `/${nextSemester}/${rest.join('/')}` : `/${nextSemester}`
}

export function AppShell() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const { semesterKey, semesterOptions, semesterLabel, pathFor } = useSemester()
  const location = useLocation()
  const navigate = useNavigate()

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
          <Link to={pathFor()} className="brand" aria-label={`${semesterLabel} Result Explorer home`}>
            <span className="brand-mark" aria-hidden="true">
              <GraduationCap size={20} strokeWidth={2.2} />
            </span>
            <span>
              <strong>Result Explorer</strong>
              <small>CSE · {semesterLabel}</small>
            </span>
          </Link>

          <div className="semester-switcher" role="group" aria-label="Semester view">
            {semesterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={option.key === semesterKey ? 'semester-chip active' : 'semester-chip'}
                aria-pressed={option.key === semesterKey}
                title={option.description}
                onClick={() => navigate(switchSemesterPath(location.pathname, option.key))}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to || 'home'} to={pathFor(to)} end={end}>
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

      <div id="main-content">
        <Outlet />
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            Independent student-built explorer. Not an official SUST result publication.
          </p>
          <Link to={pathFor('sources')}>Verify every result against its source</Link>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to || 'home'} to={pathFor(to)} end={end}>
            <Icon size={19} aria-hidden="true" />
            <span>{label.replace(' result', '')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
