/**
 * Shared chart theming utilities for Plotly-based signal charts.
 * Extracts the duplicated color derivation + CJS/ESM interop into one place.
 */
import _Plot from 'react-plotly.js'
import type { PlotParams } from 'react-plotly.js'
import type { ComponentType } from 'react'

export type ChartTheme = 'dark' | 'light'

export type ChartColors = {
  bgColor:    string
  paperColor: string
  gridColor:  string
  textColor:  string
}

export function getChartColors(theme: ChartTheme): ChartColors {
  const isDark = theme === 'dark'
  return {
    bgColor:    isDark ? '#030712' : '#f9fafb',
    paperColor: isDark ? '#111827' : '#ffffff',
    gridColor:  isDark ? '#1f2937' : '#e5e7eb',
    textColor:  isDark ? '#6b7280' : '#9ca3af',
  }
}

/**
 * CJS/ESM interop: Vite may expose react-plotly.js as { default: Component }.
 * Resolved once at module load — safe to use across all chart components.
 */
export const Plot = (_Plot as unknown as { default: ComponentType<PlotParams> }).default
  ?? (_Plot as unknown as ComponentType<PlotParams>)
