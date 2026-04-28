export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="app-page mx-auto space-y-4">
        <div className="h-12 rounded-lg bg-muted" />
        <div className="grid gap-3 md:grid-cols-4">
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
        </div>
        <div className="h-80 rounded-lg bg-muted" />
      </div>
    </div>
  )
}
