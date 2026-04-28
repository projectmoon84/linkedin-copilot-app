import { useEffect, useRef, useState } from 'react'
import { IconBrandReddit, IconCheck, IconLoader2, IconPower, IconRss, IconSearch, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { detectFeedUrl, isDetectionError, type DetectionResult } from '@/lib/feed-url-detector'
import {
  addFeedSource,
  deleteFeedSource,
  fetchFeedSources,
  triggerSourceFetch,
  updateFeedSource,
  type FeedSource,
} from '@/lib/services/feed-service'

// Curated suggested sources — one-tap subscribe
const SUGGESTED_SOURCES: Array<{ label: string; url: string; category: string }> = [
  { label: 'UX Collective', url: 'https://uxdesign.cc/feed', category: 'UX' },
  { label: 'Nielsen Norman Group', url: 'https://www.nngroup.com/feed/rss/', category: 'UX' },
  { label: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'UX' },
  { label: 'Intercom Blog', url: 'https://www.intercom.com/blog/feed.xml', category: 'Product' },
  { label: "Lenny's Newsletter", url: 'https://www.lennysnewsletter.com/feed', category: 'Product' },
  { label: 'Mind the Product', url: 'https://www.mindtheproduct.com/feed/', category: 'Product' },
  { label: 'r/UXDesign', url: 'reddit.com/r/UXDesign', category: 'Community' },
  { label: 'r/userexperience', url: 'reddit.com/r/userexperience', category: 'Community' },
  { label: 'r/ProductManagement', url: 'reddit.com/r/ProductManagement', category: 'Community' },
  { label: 'r/startups', url: 'reddit.com/r/startups', category: 'Community' },
]

type DetectionState =
  | { status: 'idle' }
  | { status: 'detecting' }
  | { status: 'detected'; result: Exclude<DetectionResult, { error: string }> }
  | { status: 'error'; message: string }

function SourceTypeBadge({ type }: { type: 'reddit' | 'rss' }) {
  return type === 'reddit' ? (
    <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
      <IconBrandReddit size={11} /> Reddit
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
      <IconRss size={11} /> RSS
    </span>
  )
}

function SourceStatusDot({ source }: { source: FeedSource }) {
  if (!source.is_active) {
    return <span className="size-2 rounded-full bg-stone-200" title="Paused" />
  }
  if (source.last_error) {
    return <span className="size-2 rounded-full bg-red-400" title={`Error: ${source.last_error}`} />
  }
  return <span className="size-2 rounded-full bg-emerald-400" title="Active" />
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function FeedSourceManager() {
  const [sources, setSources] = useState<FeedSource[]>([])
  const [loading, setLoading] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [detection, setDetection] = useState<DetectionState>({ status: 'idle' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  const detectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subscribingRef = useRef<Set<string>>(new Set())

  const loadSources = async () => {
    setLoading(true)
    try {
      setSources(await fetchFeedSources())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSources()
  }, [])

  // Auto-detect after user stops typing for 600ms
  const handleUrlChange = (value: string) => {
    setUrlInput(value)
    setDetection({ status: 'idle' })
    setAddError(null)
    if (detectDebounceRef.current) clearTimeout(detectDebounceRef.current)
    if (!value.trim()) return

    detectDebounceRef.current = setTimeout(() => {
      void runDetection(value)
    }, 600)
  }

  const runDetection = async (url: string) => {
    setDetection({ status: 'detecting' })
    const result = await detectFeedUrl(url)
    if (isDetectionError(result)) {
      setDetection({ status: 'error', message: result.error })
    } else {
      setDetection({ status: 'detected', result })
    }
  }

  const handleAdd = async () => {
    if (detection.status !== 'detected') return
    setAdding(true)
    setAddError(null)
    try {
      const source = await addFeedSource(detection.result)
      setSources((prev) => [source, ...prev])
      setUrlInput('')
      setDetection({ status: 'idle' })
      // Trigger initial fetch in background
      void triggerSourceFetch(source.id)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add source.')
    } finally {
      setAdding(false)
    }
  }

  const handleSubscribeSuggested = async (suggestion: typeof SUGGESTED_SOURCES[number]) => {
    if (subscribingRef.current.has(suggestion.url)) return
    subscribingRef.current.add(suggestion.url)
    try {
      const result = await detectFeedUrl(suggestion.url)
      if (!isDetectionError(result)) {
        const source = await addFeedSource(result, suggestion.category)
        setSources((prev) => [source, ...prev])
        void triggerSourceFetch(source.id)
      }
    } finally {
      subscribingRef.current.delete(suggestion.url)
      // Force re-render to update subscribed state
      setSources((prev) => [...prev])
    }
  }

  const handleToggleActive = async (source: FeedSource) => {
    await updateFeedSource(source.id, { is_active: !source.is_active })
    setSources((prev) => prev.map((s) => s.id === source.id ? { ...s, is_active: !s.is_active } : s))
  }

  const handleDelete = async (source: FeedSource) => {
    await deleteFeedSource(source.id)
    setSources((prev) => prev.filter((s) => s.id !== source.id))
  }

  const handleManualFetch = async (source: FeedSource) => {
    setFetchingId(source.id)
    try {
      await triggerSourceFetch(source.id)
      await loadSources()
    } finally {
      setFetchingId(null)
    }
  }

  const subscribedUrls = new Set(sources.map((s) => s.display_url))

  return (
    <div className="space-y-6">

      {/* URL input */}
      <div>
        <p className="mb-3 text-sm text-stone-500">
          Paste a website URL, subreddit URL, or RSS feed link. The platform detects what it is automatically.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="reddit.com/r/UXDesign or https://uxdesign.cc"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd() }}
            />
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
          <Button
            onClick={() => void handleAdd()}
            disabled={detection.status !== 'detected' || adding}
          >
            {adding ? <IconLoader2 className="animate-spin" size={15} /> : null}
            Add source
          </Button>
        </div>

        {/* Detection feedback */}
        {detection.status === 'detecting' && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
            <IconLoader2 size={12} className="animate-spin" /> Detecting feed type…
          </p>
        )}
        {detection.status === 'detected' && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <IconCheck size={13} />
            {detection.result.type === 'reddit'
              ? `Reddit community: ${detection.result.displayTitle} (${detection.result.sort} / ${detection.result.timeFilter ?? 'all time'})`
              : detection.result.confidence === 'likely'
              ? `Likely RSS source: ${detection.result.displayTitle}`
              : `RSS feed found: ${detection.result.displayTitle}`
            }
          </p>
        )}
        {detection.status === 'error' && (
          <p className="mt-2 text-xs text-red-500">{detection.message}</p>
        )}
        {addError && <p className="mt-2 text-xs text-red-500">{addError}</p>}
      </div>

      {/* Suggested sources */}
      {sources.length < 3 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Suggested sources</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SOURCES.map((suggestion) => {
              const isSubscribed = subscribedUrls.has(suggestion.url) ||
                subscribedUrls.has(`reddit.com/r/${suggestion.url.split('/r/')[1]}`)
              return (
                <button
                  key={suggestion.url}
                  type="button"
                  disabled={isSubscribed}
                  onClick={() => void handleSubscribeSuggested(suggestion)}
                  className={
                    isSubscribed
                      ? 'flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-600'
                      : 'flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }
                >
                  {isSubscribed ? <IconCheck size={11} /> : null}
                  {suggestion.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Source list */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
          Your sources {sources.length > 0 ? `(${sources.length})` : ''}
        </p>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : sources.length === 0 ? (
          <EmptyState
            embedded
            className="min-h-40"
            icon={<IconRss size={18} />}
            heading="No sources yet"
            description="Add a URL above or pick from the suggestions to start building your feed."
          />
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5"
              >
                <SourceStatusDot source={source} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-stone-900">{source.title}</span>
                    <SourceTypeBadge type={source.source_type} />
                  </div>
                  <p className="truncate text-xs text-stone-400">
                    {source.last_fetched_at
                      ? `Last fetched ${formatRelativeTime(source.last_fetched_at)}`
                      : 'Not yet fetched'}
                    {source.category ? ` · ${source.category}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  title="Refresh now"
                  disabled={fetchingId === source.id}
                  onClick={() => void handleManualFetch(source)}
                  className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-40"
                >
                  {fetchingId === source.id
                    ? <IconLoader2 size={14} className="animate-spin" />
                    : <IconRss size={14} />
                  }
                </button>
                <button
                  type="button"
                  title={source.is_active ? 'Pause source' : 'Resume source'}
                  onClick={() => void handleToggleActive(source)}
                  className="rounded p-1 text-stone-400 hover:bg-stone-100"
                >
                  <IconPower size={14} className={source.is_active ? 'text-emerald-500' : 'text-stone-300'} />
                </button>
                <button
                  type="button"
                  title="Remove source"
                  onClick={() => void handleDelete(source)}
                  className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-500"
                >
                  <IconX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
