import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronRight, IconLoader2, IconSparkles } from '@tabler/icons-react'
import { ComposerCanvas } from '@/components/composer/ComposerCanvas'
import { ComposerLeftPanel } from '@/components/composer/ComposerLeftPanel'
import { Button } from '@/components/ui/button'
import { useComposer } from '@/lib/hooks/useComposer'

export function ComposePage() {
  const navigate = useNavigate()
  const composer = useComposer()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const saveDraft = async () => {
    const saved = await composer.save()
    if (saved) navigate('/posts?tab=drafts')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {drawerOpen && (
        <div className="compose-resource-drawer hidden md:block">
          <ComposerLeftPanel composer={composer} onClose={() => setDrawerOpen(false)} />
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-stone-950/20" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm">
            <ComposerLeftPanel composer={composer} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${drawerOpen ? 'md:pl-80' : ''}`}>
        <header className="sticky top-0 z-20 flex min-h-14 flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900 md:hidden"
                onClick={() => setDrawerOpen(true)}
              >
                Topics
              </button>
              {!drawerOpen && (
                <button
                  type="button"
                  className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900 md:flex"
                  onClick={() => setDrawerOpen(true)}
                >
                  <IconChevronRight size={14} />
                  Topics
                </button>
              )}
              <div>
                <h1 className="font-heading text-lg font-semibold text-foreground">Compose</h1>
                <p className="text-xs text-stone-500">{composer.autosaveLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void saveDraft()} disabled={!composer.content.trim() || composer.saving}>
              {composer.saving && composer.saveStatus === 'saving' ? <IconLoader2 className="animate-spin" size={16} /> : null}
              Save draft
            </Button>
            <div className="flex flex-col">
              <Button variant="secondary" onClick={() => void composer.saveAndTrain()} disabled={!composer.content.trim() || composer.saving}>
                <IconSparkles size={16} />
                Save + train voice
              </Button>
              <span className="mt-1 hidden text-3xs text-stone-400 sm:block">Training your voice improves every future post.</span>
            </div>
          </div>
        </header>

        <ComposerCanvas composer={composer} onOpenDrawer={() => setDrawerOpen(true)} />
      </main>
    </div>
  )
}
