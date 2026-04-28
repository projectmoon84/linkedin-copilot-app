import { useState, useEffect, useCallback, useRef } from 'react'
import { IconBan, IconRefresh, IconCheck, IconLoader2 } from '@tabler/icons-react'
import { addExcludedPhrase } from '@/lib/voice-profile'
import { refineDraftSecure, type GenerationContext } from '@/lib/ai-service-secure'
import { cn } from '@/lib/utils'

interface TextSelectionToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  userId: string
  content: string
  onContentChange: (content: string) => void
  buildContext: () => GenerationContext
  onPhraseExcluded?: (phrase: string) => void
}

interface CapturedSelection {
  start: number
  end: number
  exact: string // the exact substring from content at capture time
}

export function TextSelectionToolbar({
  textareaRef,
  userId,
  content,
  onContentChange,
  buildContext,
  onPhraseExcluded,
}: TextSelectionToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [selection, setSelection] = useState<CapturedSelection | null>(null)
  const [excluding, setExcluding] = useState(false)
  const [excluded, setExcluded] = useState(false)
  const [rephrasing, setRephrasing] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  // Keep a ref to the latest content so event handlers always see the current value
  const contentRef = useRef(content)
  contentRef.current = content

  const captureSelection = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start === end) {
      setVisible(false)
      return
    }

    // Read the exact substring directly from the current content
    const currentContent = contentRef.current
    const exact = currentContent.substring(start, end)

    if (!exact.trim() || exact.trim().length < 2) {
      setVisible(false)
      return
    }

    setSelection({ start, end, exact })
    setExcluded(false)

    // Position the toolbar above the selection
    const textBefore = currentContent.substring(0, start)
    const lines = textBefore.split('\n')
    const lineIndex = lines.length - 1

    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 28
    const paddingTop = parseFloat(getComputedStyle(textarea).paddingTop) || 0
    const textareaWidth = textarea.clientWidth

    const top = paddingTop + (lineIndex * lineHeight) - textarea.scrollTop - 40
    const charWidth = 9.6 // approximate for 16px serif
    const lastLineLength = lines[lineIndex].length
    const left = Math.min(
      lastLineLength * charWidth * 0.5,
      textareaWidth - 180
    )

    setPosition({
      top: Math.max(0, top),
      left: Math.max(8, left),
    })
    setVisible(true)
  }, [textareaRef])

  // Hide on click outside (but not when clicking the toolbar itself)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node) &&
        textareaRef.current !== e.target
      ) {
        setVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [textareaRef])

  // Attach mouseup listener to textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.addEventListener('mouseup', captureSelection)
    // Also handle keyboard selection (shift+arrow keys)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) captureSelection()
    }
    textarea.addEventListener('keyup', handleKeyUp)

    return () => {
      textarea.removeEventListener('mouseup', captureSelection)
      textarea.removeEventListener('keyup', handleKeyUp)
    }
  }, [textareaRef, captureSelection])

  /**
   * Resolve the current selection range against the latest content.
   * If the stored indices still match, use them directly.
   * Otherwise, fall back to finding the exact text by string search.
   * Returns { start, end } or null if the text can't be found.
   */
  const resolveRange = (): { start: number; end: number } | null => {
    if (!selection) return null

    const current = contentRef.current

    // Fast path: stored indices still point to the same text
    if (current.substring(selection.start, selection.end) === selection.exact) {
      return { start: selection.start, end: selection.end }
    }

    // Fallback: find the exact text in the current content
    const idx = current.indexOf(selection.exact)
    if (idx !== -1) {
      return { start: idx, end: idx + selection.exact.length }
    }

    // Trimmed fallback — try finding the trimmed version
    const trimmed = selection.exact.trim()
    const idxTrimmed = current.indexOf(trimmed)
    if (idxTrimmed !== -1) {
      return { start: idxTrimmed, end: idxTrimmed + trimmed.length }
    }

    return null
  }

  // Prevent mousedown on toolbar buttons from stealing focus/selection from textarea
  const preventFocusLoss = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleExclude = async () => {
    if (!selection) return
    const phrase = selection.exact.trim()
    if (!phrase) return

    setExcluding(true)
    try {
      await addExcludedPhrase(userId, phrase)
      setExcluded(true)
      onPhraseExcluded?.(phrase)
      setTimeout(() => setVisible(false), 1200)
    } catch (err) {
      console.error('Failed to exclude phrase:', err)
    } finally {
      setExcluding(false)
    }
  }

  const handleRephrase = async () => {
    const range = resolveRange()
    if (!range || !selection) return

    const currentContent = contentRef.current
    const exactText = currentContent.substring(range.start, range.end)

    setRephrasing(true)
    try {
      // Build surrounding context for better rephrasing
      const before = currentContent.substring(Math.max(0, range.start - 300), range.start)
      const after = currentContent.substring(range.end, Math.min(currentContent.length, range.end + 300))

      const instruction = [
        `Rephrase ONLY the following selected text in a different way that fits the surrounding context.`,
        `Return ONLY the replacement text with no extra commentary, quotes, or explanation.`,
        ``,
        `SURROUNDING CONTEXT (before):`,
        `"""${before}"""`,
        ``,
        `SELECTED TEXT TO REPHRASE:`,
        `"""${exactText}"""`,
        ``,
        `SURROUNDING CONTEXT (after):`,
        `"""${after}"""`,
      ].join('\n')

      const rephrased = await refineDraftSecure(exactText, instruction, buildContext())

      // Clean the response — strip surrounding quotes if the AI added them
      let cleaned = rephrased.trim()
      if (
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith('\u201c') && cleaned.endsWith('\u201d'))
      ) {
        cleaned = cleaned.slice(1, -1)
      }

      // Splice the rephrased text back into content at the resolved range
      const newContent =
        currentContent.substring(0, range.start) +
        cleaned +
        currentContent.substring(range.end)

      onContentChange(newContent)
      setVisible(false)
    } catch (err) {
      console.error('Failed to rephrase:', err)
    } finally {
      setRephrasing(false)
    }
  }

  if (!visible) return null

  const displayText = selection?.exact.trim() || ''

  return (
    <div
      ref={toolbarRef}
      onMouseDown={preventFocusLoss}
      className={cn(
        'absolute z-30 flex flex-col gap-1 px-1.5 py-1.5 rounded-lg',
        'bg-stone-900/92 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.16)]',
        'animate-in fade-in slide-in-from-bottom-1 duration-150'
      )}
      style={{ top: position.top, left: position.left }}
    >
      {/* Show what's selected so the user can verify */}
      {displayText.length > 0 && (
        <div className="px-2 py-1 text-2xs text-white/50 truncate max-w-[260px]">
          "{displayText.length > 60 ? displayText.substring(0, 60) + '...' : displayText}"
        </div>
      )}

      <div className="flex items-center gap-0.5">
        <button
          onClick={handleExclude}
          disabled={excluding || excluded}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/80 hover:text-white hover:bg-card/10 transition-all whitespace-nowrap disabled:opacity-50"
        >
          {excluded ? (
            <>
              <IconCheck size={13} />
              Excluded
            </>
          ) : excluding ? (
            <>
              <IconLoader2 size={13} className="animate-spin" />
              Excluding...
            </>
          ) : (
            <>
              <IconBan size={13} />
              Exclude phrase
            </>
          )}
        </button>

        <div className="w-px h-4 bg-card/15" />

        <button
          onClick={handleRephrase}
          disabled={rephrasing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/80 hover:text-white hover:bg-card/10 transition-all whitespace-nowrap disabled:opacity-50"
        >
          {rephrasing ? (
            <>
              <IconLoader2 size={13} className="animate-spin" />
              Rephrasing...
            </>
          ) : (
            <>
              <IconRefresh size={13} />
              Rephrase
            </>
          )}
        </button>
      </div>
    </div>
  )
}
