import { ArrowRight, Search } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSemester } from '../context/SemesterContext'

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const [registration, setRegistration] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { pathFor, semesterLabel } = useSemester()
  const inputId = useId()
  const helpId = `${inputId}-help`

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = registration.replace(/\s/g, '')
    if (!/^\d{10}$/.test(normalized)) {
      setError('Enter a complete 10-digit registration number.')
      return
    }
    setError('')
    navigate(pathFor(`result/${normalized}`))
  }

  return (
    <form className={`result-search ${compact ? 'result-search-compact' : ''}`} onSubmit={submit} noValidate>
      <label htmlFor={inputId}>{compact ? 'Registration number' : 'Find an individual result'}</label>
      {!compact && (
        <p id={helpId}>
          Search published registrations in the {semesterLabel.toLowerCase()} view.
        </p>
      )}
      <div className="search-control">
        <Search size={19} aria-hidden="true" />
        <input
          id={inputId}
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="e.g. 2024331001"
          value={registration}
          onChange={(event) => {
            setRegistration(event.target.value.replace(/\D/g, ''))
            if (error) setError('')
          }}
          aria-describedby={!compact ? helpId : undefined}
          aria-invalid={Boolean(error)}
        />
        <button type="submit">
          <span>View result</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
