'use client'

import { ThemeProvider } from 'next-themes'
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

if (typeof window !== 'undefined') {
  const originalError = console.error
  const originalWarn = console.warn
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Support for defaultProps will be removed from memo components') ||
        args[0].includes('Connect(Droppable)'))
    ) {
      return
    }
    originalError.apply(console, args)
  }
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Support for defaultProps will be removed from memo components') ||
        args[0].includes('Connect(Droppable)'))
    ) {
      return
    }
    originalWarn.apply(console, args)
  }
}

export default function RootLayoutComp({
  children
}: {
  children: React.ReactNode
}) {
  // const compactMode = getLocalCache('COMPACT_MENU') ? 'compact-menu' : ''
  const compactMode = ''

  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <div className={`root-container ${compactMode}`}>{children}</div>
    </ThemeProvider>
  )
}
