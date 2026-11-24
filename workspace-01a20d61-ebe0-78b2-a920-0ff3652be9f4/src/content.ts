import { useEffect, useState } from 'react'
import bundled from '../content/projects.json'
import { isProjectArray, type Project } from './types'

export const PROJECTS_STORAGE_KEY = 'eg-portfolio-projects-v1'
export const PROJECTS_EVENT = 'portfolio:projects-changed'

const fallback = bundled as unknown as Project[]

export function bundledProjects(): Project[] {
  return fallback
}

export function loadProjects(): Project[] {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isProjectArray(parsed)) return parsed
    }
  } catch {
    /* Private browsing or malformed local data — use the bundled content. */
  }
  return fallback
}

export function saveLocalProjects(projects: Project[]): void {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  window.dispatchEvent(new CustomEvent(PROJECTS_EVENT))
}

export function clearLocalProjects(): void {
  window.localStorage.removeItem(PROJECTS_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(PROJECTS_EVENT))
}

export function hasLocalProjects(): boolean {
  try {
    return window.localStorage.getItem(PROJECTS_STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function useProjects(): Project[] {
  const [projects, setProjects] = useState<Project[]>(() =>
    typeof window === 'undefined' ? fallback : loadProjects(),
  )

  useEffect(() => {
    const sync = () => setProjects(loadProjects())
    window.addEventListener(PROJECTS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PROJECTS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return projects
}
