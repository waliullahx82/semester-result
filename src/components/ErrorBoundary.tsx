import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Result Explorer error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <p className="eyebrow">Application error</p>
          <h1>We could not display the results.</h1>
          <p>Reload the page. If the problem continues, verify the generated result data and rebuild the site.</p>
          <button type="button" className="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
