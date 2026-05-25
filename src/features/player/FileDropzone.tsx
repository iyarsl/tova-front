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
  const inputRef    = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile, disabled])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    // Reset so the same file can be re-uploaded
    e.target.value = ''
  }, [onFile])

  const loaded = fileName !== ''

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative flex items-center gap-4 px-5 py-3.5 rounded-lg border cursor-pointer
        transition-all duration-200 select-none
        ${dragging
          ? 'border-amber-400/70 dark:bg-amber-400/5 bg-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : loaded
            ? 'dark:border-amber-400/30 border-amber-300/60 dark:bg-amber-400/[0.04] bg-amber-50/60'
            : 'dark:border-white/10 border-black/[0.1] dark:bg-white/[0.02] bg-white dark:hover:border-amber-400/30 hover:border-amber-300/50 dark:hover:bg-amber-400/[0.03]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Icon */}
      <div className={`text-xl flex-shrink-0 transition-colors ${
        loaded ? 'text-amber-400' : 'dark:text-[#4b5563] text-[#9ca3af]'
      }`}>
        {loaded ? '◈' : '⊕'}
      </div>

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
          <div>
            <span className="font-mono text-sm dark:text-[#9ca3af] text-[#6b7280]">
              Drop <span className="dark:text-amber-400 text-amber-600">.fc32</span> file or{' '}
              <span className="dark:text-amber-400 text-amber-600 underline underline-offset-2">click to browse</span>
            </span>
          </div>
        )}
      </div>

      {/* Replace hint when loaded */}
      {loaded && (
        <span className="font-mono text-[10px] tracking-widest uppercase dark:text-[#4b5563] text-[#9ca3af] flex-shrink-0">
          click to replace
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".fc32"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
