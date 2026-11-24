export type Accent = 'mint' | 'blue' | 'violet' | 'amber' | 'cyan'

export type Category = 'AI & LLM' | 'Backend & APIs' | 'Full-stack' | 'DevOps & CI/CD'

export interface Project {
  id: string
  title: string
  subtitle: string
  category: Category
  status: string
  role: string
  summary: string
  highlights: string[]
  tech: string[]
  repo: string
  demo: string
  accent: Accent
  featured: boolean
}

export const CATEGORIES: Category[] = ['AI & LLM', 'Backend & APIs', 'Full-stack', 'DevOps & CI/CD']

export const ACCENTS: Accent[] = ['mint', 'blue', 'violet', 'amber', 'cyan']

export function isProjectArray(value: unknown): value is Project[] {
  if (!Array.isArray(value)) return false
  return value.every((item) => {
    if (!item || typeof item !== 'object') return false
    const p = item as Record<string, unknown>
    return (
      typeof p.id === 'string' &&
      typeof p.title === 'string' &&
      typeof p.summary === 'string' &&
      Array.isArray(p.tech) &&
      Array.isArray(p.highlights)
    )
  })
}
