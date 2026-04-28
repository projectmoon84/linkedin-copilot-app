import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <h2 className="font-heading text-lg font-semibold text-foreground">This page had an error</h2>
            <p className="text-sm text-muted-foreground">Try again, or refresh if the page stays stuck.</p>
            {this.state.error && (
              <p className="break-all rounded-lg bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={() => this.setState({ hasError: false, error: null })}>Try again</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
