import { useEffect, useState } from 'react'
import { IconLoader2, IconPower, IconRss, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectInput, TextInput } from '@/components/ui/form-controls'
import { Skeleton } from '@/components/ui/skeleton'
import { addRssSource, fetchContentSources, setSourceActive, SOURCE_CATEGORIES, type ContentSource } from '@/lib/content-sources'

export function KnowledgeBaseManager() {
  const [sources, setSources] = useState<ContentSource[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('ux_general')
  const [error, setError] = useState<string | null>(null)

  const loadSources = async () => {
    setLoading(true)
    try {
      setSources(await fetchContentSources())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSources()
  }, [])

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    setSaving(true)
    setError(null)
    try {
      await addRssSource({ name: name.trim(), url: url.trim(), category })
      setName('')
      setUrl('')
      await loadSources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Source could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSource = async (source: ContentSource) => {
    await setSourceActive(source.id, !source.isActive)
    setSources((current) => current.map((item) => item.id === source.id ? { ...item, isActive: !item.isActive } : item))
  }

  const removeSource = async (source: ContentSource) => {
    await setSourceActive(source.id, false)
    setSources((current) => current.filter((item) => item.id !== source.id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="app-card-title">Your RSS feeds</h2>
        <p className="mt-1 text-sm text-stone-500">Articles from these feeds will appear in your Trends page, personalised to your niche.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_180px_auto]">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Source name" />
        <TextInput value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/feed.xml" />
        <SelectInput value={category} onChange={setCategory} options={SOURCE_CATEGORIES.filter((item) => item.value !== 'all')} />
        <Button onClick={() => void handleAdd()} disabled={saving || !name.trim() || !url.trim()}>
          {saving ? <IconLoader2 className="animate-spin" size={16} /> : null}
          Add
        </Button>
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16" />)}
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          embedded
          className="min-h-48"
          icon={<IconRss size={20} />}
          heading="No RSS feeds yet"
          description="Add trusted sources and their articles will appear in Trends."
        />
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <IconRss size={16} className="shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{source.name}</p>
                <p className="truncate text-xs text-stone-500">{source.url}</p>
              </div>
              <span className="app-chip bg-stone-100 text-stone-500">{source.category}</span>
              <Button variant="ghost" size="icon" onClick={() => void toggleSource(source)} aria-label={source.isActive ? 'Disable source' : 'Enable source'}>
                <IconPower size={16} className={source.isActive ? 'text-positive' : 'text-stone-300'} />
              </Button>
              {!source.isDefault && (
                <Button variant="ghost" size="icon" onClick={() => void removeSource(source)} aria-label="Remove source">
                  <IconTrash size={16} className="text-stone-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
