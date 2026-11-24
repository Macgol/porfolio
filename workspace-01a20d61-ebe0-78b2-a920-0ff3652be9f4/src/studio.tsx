import { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { bundledProjects, loadProjects, saveLocalProjects, clearLocalProjects, PROJECTS_STORAGE_KEY } from './content'
import { ACCENTS, CATEGORIES, isProjectArray, type Accent, type Category, type Project } from './types'
import './styles.css'
import './studio.css'

/* --------------------------------------------------------------- helpers */

const CONNECTION_KEY = 'eg-studio-github-v1'
const CONTENT_PATH = 'content/projects.json'

interface Connection {
  token: string
  repo: string
  branch: string
}

const emptyConnection: Connection = { token: '', repo: '', branch: 'main' }

function readConnection(): Connection {
  try {
    const raw = localStorage.getItem(CONNECTION_KEY)
    if (raw) return { ...emptyConnection, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return emptyConnection
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function fromBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'
}

function uniqueId(projects: Project[], title: string): string {
  const base = slugify(title)
  let id = base
  let n = 2
  while (projects.some((p) => p.id === id)) id = `${base}-${n++}`
  return id
}

function newProject(projects: Project[]): Project {
  return {
    id: uniqueId(projects, 'new-project'),
    title: 'Untitled project',
    subtitle: '',
    category: 'AI & LLM',
    status: 'In progress',
    role: '',
    summary: '',
    highlights: [],
    tech: [],
    repo: '',
    demo: '',
    accent: 'mint',
    featured: true,
  }
}

const lines = (items: string[]) => items.join('\n')
const splitLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)

/* ------------------------------------------------------------- studio app */

type Message = { kind: 'ok' | 'error' | 'info'; text: string } | null

function Studio() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())
  const [selectedId, setSelectedId] = useState<string>(() => loadProjects()[0]?.id ?? '')
  const [connection, setConnection] = useState<Connection>(readConnection)
  const [remoteSha, setRemoteSha] = useState('')
  const [message, setMessage] = useState<Message>({ kind: 'info', text: 'Changes are saved in this browser. Publish to GitHub to update the live site.' })
  const [busy, setBusy] = useState<'connect' | 'publish' | 'pull' | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => projects.find((p) => p.id === selectedId) ?? projects[0], [projects, selectedId])

  useEffect(() => {
    try { localStorage.setItem(CONNECTION_KEY, JSON.stringify(connection)) } catch { /* ignore */ }
  }, [connection])

  const persist = (next: Project[]) => {
    setProjects(next)
    saveLocalProjects(next)
  }

  const patch = (changes: Partial<Project>) => {
    if (!selected) return
    persist(projects.map((p) => (p.id === selected.id ? { ...p, ...changes } : p)))
  }

  const addProject = () => {
    const project = newProject(projects)
    persist([...projects, project])
    setSelectedId(project.id)
    setMessage({ kind: 'ok', text: 'Project added. Fill in the details on the right.' })
  }

  const removeProject = () => {
    if (!selected || !window.confirm(`Delete “${selected.title}”? This also updates the local preview.`)) return
    const next = projects.filter((p) => p.id !== selected.id)
    persist(next)
    setSelectedId(next[0]?.id ?? '')
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= projects.length) return
    const next = [...projects]
    ;[next[index], next[target]] = [next[target], next[index]]
    persist(next)
  }

  const validate = (): string | null => {
    if (!projects.length) return 'Add at least one project before publishing.'
    const ids = projects.map((p) => p.id)
    if (new Set(ids).size !== ids.length) return 'Project IDs must be unique.'
    if (projects.some((p) => !p.title.trim() || !p.summary.trim())) return 'Every project needs a title and a summary.'
    if (!connection.token.trim() || !/^[\w.-]+\/[\w.-]+$/.test(connection.repo.trim())) return 'Add your GitHub token and repo in Connection settings first.'
    return null
  }

  const githubHeaders = () => ({
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${connection.token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
  })

  const connect = async () => {
    setBusy('connect')
    setMessage(null)
    try {
      const response = await fetch(
        `https://api.github.com/repos/${connection.repo.trim()}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(connection.branch)}`,
        { headers: githubHeaders() },
      )
      if (response.status === 404) {
        setRemoteSha('')
        setMessage({ kind: 'info', text: 'Connected. The content file does not exist yet — publishing will create it.' })
      } else if (!response.ok) {
        throw new Error(`GitHub responded ${response.status}. Check the token, repo name and branch.`)
      } else {
        const data = (await response.json()) as { sha?: string; content?: string }
        setRemoteSha(data.sha ?? '')
        setMessage({ kind: 'ok', text: 'Connected to GitHub. Your content file is ready to edit.' })
      }
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not connect to GitHub.' })
    } finally {
      setBusy(null)
    }
  }

  const pullFromGithub = async () => {
    setBusy('pull')
    setMessage(null)
    try {
      const response = await fetch(
        `https://api.github.com/repos/${connection.repo.trim()}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(connection.branch)}`,
        { headers: githubHeaders() },
      )
      if (!response.ok) throw new Error(`GitHub responded ${response.status}. Check your connection settings.`)
      const data = (await response.json()) as { sha?: string; content?: string }
      if (!data.content) throw new Error('The content file came back empty.')
      const parsed: unknown = JSON.parse(fromBase64(data.content))
      if (!isProjectArray(parsed)) throw new Error('The content file is not a valid projects file.')
      setRemoteSha(data.sha ?? '')
      persist(parsed)
      setSelectedId(parsed[0]?.id ?? '')
      setMessage({ kind: 'ok', text: 'Loaded the latest published projects.' })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load the content file.' })
    } finally {
      setBusy(null)
    }
  }

  const publish = async () => {
    const problem = validate()
    if (problem) { setMessage({ kind: 'error', text: problem }); return }
    setBusy('publish')
    setMessage(null)
    try {
      // Always re-read the SHA so we never overwrite a newer commit.
      const current = await fetch(
        `https://api.github.com/repos/${connection.repo.trim()}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(connection.branch)}`,
        { headers: githubHeaders() },
      )
      if (!current.ok && current.status !== 404) throw new Error(`GitHub responded ${current.status}. Check your connection settings.`)
      let sha = remoteSha
      if (current.ok) {
        const data = (await current.json()) as { sha?: string }
        sha = data.sha ?? ''
      } else {
        sha = ''
      }

      const body: Record<string, string> = {
        message: `Update portfolio projects from Studio`,
        content: toBase64(JSON.stringify(projects, null, 2) + '\n'),
        branch: connection.branch.trim(),
      }
      if (sha) body.sha = sha

      const response = await fetch(
        `https://api.github.com/repos/${connection.repo.trim()}/contents/${CONTENT_PATH}`,
        {
          method: 'PUT',
          headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!response.ok) {
        const details = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(details?.message ?? `GitHub responded ${response.status}.`)
      }
      setRemoteSha(((await response.json()) as { content?: { sha?: string } }).content?.sha ?? '')
      setMessage({ kind: 'ok', text: 'Published. Vercel will rebuild the site in a moment — check your deployment.' })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Publishing failed.' })
    } finally {
      setBusy(null)
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2) + '\n'], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'projects.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isProjectArray(parsed)) throw new Error('That file is not a valid projects file.')
      persist(parsed)
      setSelectedId(parsed[0]?.id ?? '')
      setMessage({ kind: 'ok', text: 'Projects imported.' })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not read that file.' })
    }
  }

  const resetLocal = () => {
    if (!window.confirm('Discard local edits and start again from the bundled CV projects?')) return
    clearLocalProjects()
    const fresh = bundledProjects()
    setProjects(fresh)
    setSelectedId(fresh[0]?.id ?? '')
    setMessage({ kind: 'info', text: 'Local edits cleared.' })
  }

  return (
    <div className="studio">
      <header className="studio-nav">
        <a href="/" className="studio-back">← Back to site</a>
        <span className="studio-title"><span className="studio-dot" /> CONTENT STUDIO</span>
        <button className="ghost-btn" onClick={() => setShowSettings((v) => !v)}>
          {showSettings ? 'Hide settings' : 'Connection settings'}
        </button>
      </header>

      {showSettings && (
        <section className="settings-panel">
          <div className="settings-grid">
            <label>
              <span>GitHub personal access token</span>
              <input type="password" value={connection.token} placeholder="github_pat_…" onChange={(e) => setConnection({ ...connection, token: e.target.value })} autoComplete="off" />
            </label>
            <label>
              <span>Repository</span>
              <input value={connection.repo} placeholder="your-name/portfolio-repo" onChange={(e) => setConnection({ ...connection, repo: e.target.value })} />
            </label>
            <label>
              <span>Branch</span>
              <input value={connection.branch} placeholder="main" onChange={(e) => setConnection({ ...connection, branch: e.target.value })} />
            </label>
            <div className="settings-actions">
              <button className="primary-btn" onClick={connect} disabled={busy !== null}>{busy === 'connect' ? 'Connecting…' : 'Connect'}</button>
              <button className="ghost-btn" onClick={pullFromGithub} disabled={busy !== null}>Pull latest</button>
            </div>
          </div>
          <p className="settings-note">
            Use a fine-grained token with <strong>Contents: write</strong> on this one repository. It stays in this browser's local storage and is sent only to api.github.com. It is never baked into the site.
          </p>
        </section>
      )}

      <div className="studio-message" data-kind={message?.kind ?? 'info'}>
        <span>{message?.text ?? ''}</span>
        <span className="studio-save-state">{localStorage.getItem(PROJECTS_STORAGE_KEY) ? 'LOCAL COPY ACTIVE' : 'USING PUBLISHED CONTENT'}</span>
      </div>

      <div className="studio-layout">
        <aside className="project-list">
          <div className="list-head">
            <span>PROJECTS <b>{projects.length}</b></span>
            <button className="add-btn" onClick={addProject}>+ Add</button>
          </div>
          <div className="list-items">
            {projects.map((project, i) => (
              <button key={project.id} className={`list-item ${selected?.id === project.id ? 'active' : ''}`} onClick={() => setSelectedId(project.id)}>
                <span className="list-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="list-text">
                  <strong>{project.title}</strong>
                  <small>{project.category} · {project.status}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="list-tools">
            <button onClick={exportJson}>Export JSON</button>
            <button onClick={() => fileInput.current?.click()}>Import JSON</button>
            <button onClick={resetLocal}>Reset local edits</button>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </div>
        </aside>

        {selected && (
          <main className="editor">
            <div className="editor-head">
              <div>
                <p className="editor-kicker">EDITING PROJECT</p>
                <h1>{selected.title}</h1>
              </div>
              <div className="editor-head-actions">
                <button className="ghost-btn" onClick={() => removeProject()}>Delete</button>
                <a className="ghost-btn" href="/" target="_blank" rel="noreferrer">Preview site ↗</a>
              </div>
            </div>

            <div className="editor-grid">
              <div className="field-block wide">
                <label>Project title<input value={selected.title} onChange={(e) => patch({ title: e.target.value })} /></label>
                <label>Subtitle<input value={selected.subtitle} placeholder="One-line descriptor" onChange={(e) => patch({ subtitle: e.target.value })} /></label>
              </div>

              <div className="field-block wide">
                <label>Summary<textarea rows={3} value={selected.summary} onChange={(e) => patch({ summary: e.target.value })} /></label>
              </div>

              <label>Category
                <select value={selected.category} onChange={(e) => patch({ category: e.target.value as Category })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  {!CATEGORIES.includes(selected.category) && <option>{selected.category}</option>}
                </select>
              </label>

              <label>Status<input value={selected.status} onChange={(e) => patch({ status: e.target.value })} /></label>

              <label>Your role<input value={selected.role} onChange={(e) => patch({ role: e.target.value })} /></label>

              <label>Accent colour
                <select value={selected.accent} onChange={(e) => patch({ accent: e.target.value as Accent })}>
                  {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>

              <label className="checkbox-field">
                <input type="checkbox" checked={selected.featured} onChange={(e) => patch({ featured: e.target.checked })} />
                <span>Show in portfolio</span>
              </label>

              <label>Repository URL<input value={selected.repo} placeholder="https://github.com/…" onChange={(e) => patch({ repo: e.target.value })} /></label>

              <label>Live demo URL<input value={selected.demo} placeholder="https://…" onChange={(e) => patch({ demo: e.target.value })} /></label>

              <label className="wide">Highlights <small>one per line</small>
                <textarea rows={6} value={lines(selected.highlights)} onChange={(e) => patch({ highlights: splitLines(e.target.value) })} />
              </label>

              <label className="wide">Tech stack <small>comma or new line separated</small>
                <textarea rows={3} value={selected.tech.join(', ')} onChange={(e) => patch({ tech: e.target.value.split(/[,\n]/).map((t) => t.trim()).filter(Boolean) })} />
              </label>

              <label>Project ID <small>URL-safe slug</small>
                <input value={selected.id} onChange={(e) => patch({ id: slugify(e.target.value) })} />
              </label>
            </div>

            <div className="reorder">
              <span>Order: {projects.indexOf(selected) + 1} of {projects.length}</span>
              <div>
                <button onClick={() => move(projects.indexOf(selected), -1)}>↑ Move up</button>
                <button onClick={() => move(projects.indexOf(selected), 1)}>↓ Move down</button>
              </div>
            </div>
          </main>
        )}
      </div>

      <footer className="publish-bar">
        <span>Every edit is saved locally. Publishing writes <code>{CONTENT_PATH}</code> to your repo.</span>
        <div>
          <button className="ghost-btn" onClick={() => { saveLocalProjects(projects); setMessage({ kind: 'ok', text: 'Saved to this browser. Open the site to preview.' }) }}>Save locally</button>
          <button className="primary-btn" onClick={publish} disabled={busy !== null}>
            {busy === 'publish' ? 'Publishing…' : 'Publish to GitHub'}
          </button>
        </div>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('studio-root')!).render(<Studio />)
