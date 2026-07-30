import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SemesterProvider } from '../context/SemesterContext'
import { SearchForm } from './SearchForm'

function renderWithSemester(initialEntry = '/1-2') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/:semester"
          element={
            <SemesterProvider>
              <SearchForm />
            </SemesterProvider>
          }
        />
        <Route
          path="/:semester/result/:registration"
          element={<p>Result route</p>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SearchForm', () => {
  it('requires a complete registration number', async () => {
    const user = userEvent.setup()
    renderWithSemester()
    await user.type(screen.getByLabelText('Find an individual result'), '202433')
    await user.click(screen.getByRole('button', { name: 'View result' }))
    expect(screen.getByRole('alert')).toHaveTextContent('10-digit')
  })

  it('navigates to the normalized result route', async () => {
    const user = userEvent.setup()
    renderWithSemester()
    await user.type(screen.getByLabelText('Find an individual result'), '2024331001')
    await user.click(screen.getByRole('button', { name: 'View result' }))
    expect(screen.getByText('Result route')).toBeInTheDocument()
  })
})
