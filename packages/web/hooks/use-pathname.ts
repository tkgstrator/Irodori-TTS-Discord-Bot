'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getSnapshot() {
  return window.location.pathname
}

function getServerSnapshot() {
  return '/'
}

export function usePathname() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
