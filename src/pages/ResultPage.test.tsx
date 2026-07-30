import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SemesterProvider } from '../context/SemesterContext'
import { ResultPage } from './ResultPage'

function renderResult(registration: string, semester = '1-2') {
  render(
    <MemoryRouter initialEntries={[`/${semester}/result/${registration}`]}>
      <Routes>
        <Route
          path="/:semester/result/:registration"
          element={
            <SemesterProvider>
              <ResultPage />
            </SemesterProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResultPage', () => {
  it('shows a complete result with all courses', () => {
    renderResult('2024331001')
    expect(screen.getByRole('heading', { name: 'WASIF JAMIL SIDDIQUE' })).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(10)
  })

  it('shows the reviewed conflict without an inferred SGPA', () => {
    renderResult('2024331088')
    expect(screen.getByText('This record is not comparable yet.')).toBeInTheDocument()
    expect(screen.getByText('Needs review')).toBeInTheDocument()
    expect(screen.getByText(/No SGPA or overall rank has been inferred/)).toBeInTheDocument()
  })

  it('shows an empty state for an unknown registration', () => {
    renderResult('9999999999')
    expect(screen.getByRole('heading', { name: 'No published result found' })).toBeInTheDocument()
  })

  it('shows grouped combined courses for both semesters', () => {
    renderResult('2024331001', 'combined')
    expect(screen.getByRole('heading', { name: '1-1 semester courses' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '1-2 semester courses' })).toBeInTheDocument()
    expect(screen.getByText('Combined CGPA')).toBeInTheDocument()
  })
})
