import React, { ErrorInfo, ReactNode } from 'react'
// @ts-ignore
import KrupaApp from '../landing_krupa/App.jsx'
import '../landing_krupa/index.css'
import '../landing_krupa/App.css'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red', background: '#fee' }}>
          <h2>React Crashed in Landing!</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Landing() {
  return (
    <ErrorBoundary>
      <div className="medicheck-app" style={{ minHeight: '100vh', width: '100vw', background: '#f8fafc', overflowX: 'hidden' }}>
        <KrupaApp />
      </div>
    </ErrorBoundary>
  )
}
