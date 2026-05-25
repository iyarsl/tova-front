import { useCallback, useRef, useState } from 'react'

type Props = {
  onFile: (file: File) => void
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

export function FileDropzone({ onFile, fileName, fileSizeBytes, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // ── file selection via input ────────────────────────────────────────────────
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = '' // reset so same file can be re-selected
  }, [onFile])

  // Prevent the input's own click from bubbling back up to the wrapper div,
  // which would re-trigger input.click() in an infinite loop.
  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const openFilePicker = useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

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

  const loaded = fileName !== ''

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={loaded ? 'Replace file' : 'Select .fc32 file'}
      onClick={openFilePicker}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker() }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation() }}
      onDrop={handleDrop}
      className={[
        'flex items-center gap-4 px-5 py-3.5 rounded-lg border cursor-pointer',
        'transition-all duration-200 select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-amber-400/50',
        dragging
          ? 'border-amber-400/70 dark:bg-amber-400/5 bg-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : loaded
            ? 'dark:border-amber-400/30 border-amber-300/60 dark:bg-amber-400/[0.04] bg-amber-50/60'
            : 'dark:border-white/10 border-black/[0.1] dark:bg-white/[0.02] bg-white dark:hover:border-amber-400/30 hover:border-amber-300/50 dark:hover:bg-amber-400/[0.03]',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Icon */}
      <span className={`text-xl flex-shrink-0 transition-colors ${
        loaded ? 'text-amber-400' : 'dark:text-[#4b5563] text-[#9ca3af]'
      }`}>
        {loaded ? '◈' : '⊕'}
      </span>

      {/* Label */}
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

      {loaded && (
        <span className="font-mono text-[10px] tracking-widest uppercase dark:text-[#4b5563] text-[#9ca3af] flex-shrink-0">
          click to replace
        </span>
      )}

      {/*
        Hidden file input.
        onClick stopPropagation is CRITICAL — without it, the click triggered by
        inputRef.current?.click() would bubble back up to the wrapper div, which
        would call inputRef.current?.click() again → infinite loop.
      */}
      <input
        ref={inputRef}
        type="file"
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, overflow: 'hidden' }}
        onClick={handleInputClick}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
