import { useCallback, useId, useState } from 'react'

type Props = {
  onFile: (file: File) => void
  onRemove?: () => void
  fileName: string
  fileSizeBytes: number
  disabled?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileDropzone({ onFile, onRemove, fileName, fileSizeBytes, disabled = false }: Props) {
  // useId gives a stable, unique id per component instance — safe for htmlFor
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = '' // reset so same file can be re-selected
  }, [onFile])

  // ── drag-and-drop ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // Only clear when leaving the dropzone entirely, not entering a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile, disabled])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const loaded = fileName !== ''

  /*
   * Architecture: <label htmlFor> pointing to an <input> that is OUTSIDE the label.
   *
   * Why this works reliably:
   *   - Label activation (click) bypasses display:none on the target input — it's
   *     part of the HTML spec and works in every browser.
   *   - The input is NOT inside the label, so there is exactly ONE activation path
   *     (htmlFor), no containment-based double-forward.
   *   - No programmatic .click() on the input = no bubble loop possible.
   *
   * Why previous approaches failed:
   *   1. div.onClick → input.click() without stopPropagation → infinite bubble loop
   *   2. label containing input + htmlFor → two activation paths → double-fire loop
   *   3. div.onClick → input.click() with stopPropagation, but input had
   *      width:0 height:0 → browsers silently block file picker on zero-size inputs
   *   4. document.createElement('input').click() → detached DOM element →
   *      Chrome/Edge silently block file picker for off-document inputs
   */
  return (
    <>
      {/*
        label.htmlFor = inputId → clicking the label opens the file picker.
        The input is rendered BELOW, outside this label element.
        No onClick handler needed on the label — that's the whole point.
      */}
      <label
        htmlFor={disabled ? undefined : inputId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={loaded ? 'Replace file' : 'Select .fc32 file'}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        className={[
          'flex items-center gap-4 px-5 py-3.5 rounded-lg border',
          'transition-all duration-200 select-none outline-none',
          'focus-visible:ring-2 focus-visible:ring-amber-400/50',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          dragging
            ? 'border-amber-400/70 dark:bg-amber-400/5 bg-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
            : loaded
              ? 'dark:border-amber-400/30 border-amber-300/60 dark:bg-amber-400/[0.04] bg-amber-50/60'
              : 'dark:border-white/10 border-black/[0.1] dark:bg-white/[0.02] bg-white dark:hover:border-amber-400/30 hover:border-amber-300/50 dark:hover:bg-amber-400/[0.03]',
        ].join(' ')}
      >
        {/* Icon */}
        <span className={`text-xl flex-shrink-0 transition-colors ${
          loaded ? 'text-amber-400' : 'dark:text-[#4b5563] text-[#9ca3af]'
        }`}>
          {loaded ? '◈' : '⊕'}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {loaded ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm dark:text-amber-300 text-amber-700 truncate max-w-xs">
                {fileName}
              </span>
              <span className="font-mono text-xs dark:text-[#6b7280] text-[#9ca3af] flex-shrink-0">
                {formatBytes(fileSizeBytes)}
              </span>
            </div>
          ) : (
            <span className="font-mono text-sm dark:text-[#9ca3af] text-[#6b7280]">
              Drop <span className="dark:text-amber-400 text-amber-600">.fc32</span> file or{' '}
              <span className="dark:text-amber-400 text-amber-600 underline underline-offset-2">
                click to browse
              </span>
            </span>
          )}
        </div>

        {loaded && onRemove && (
          <button
            type="button"
            aria-label="Remove file"
            onClick={(e) => {
              e.preventDefault()   // don't activate the label → file picker
              e.stopPropagation()  // don't bubble to label
              onRemove()
            }}
            className="
              flex-shrink-0 w-6 h-6 flex items-center justify-center rounded
              font-mono text-xs transition-colors
              dark:text-[#6b7280] text-[#9ca3af]
              dark:hover:text-rose-400 hover:text-rose-500
              dark:hover:bg-rose-400/10 hover:bg-rose-50
            "
          >
            ✕
          </button>
        )}

        {loaded && !onRemove && (
          <span className="font-mono text-[10px] tracking-widest uppercase dark:text-[#4b5563] text-[#9ca3af] flex-shrink-0">
            click to replace
          </span>
        )}
      </label>

      {/*
        Input lives OUTSIDE the label — only one activation path (htmlFor).
        display:none is fine here: label activation bypasses the display restriction.
        The input is not zero-size, not detached, not programmatically clicked.
      */}
      <input
        id={inputId}
        type="file"
        accept=".fc32"
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  )
}
