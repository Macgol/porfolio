import { useEffect, useMemo, useState } from 'react'
import { useProjects } from './content'
import { certifications, education, experience, interests, profile, stack } from './profile'
import { CATEGORIES, type Category, type Project } from './types'

/* ------------------------------------------------------------------ icons */

type IconProps = { size?: number; className?: string }

const ArrowUpRight = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GithubIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.75-.24.75-.53v-2.08c-3.06.66-3.7-1.3-3.7-1.3-.5-1.27-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.69-1.47-2.44-.28-5-1.22-5-5.42 0-1.2.43-2.18 1.13-2.95-.12-.28-.49-1.4.1-2.92 0 0 .92-.3 3.02 1.12a10.5 10.5 0 0 1 5.5 0c2.1-1.42 3.02-1.12 3.02-1.12.6 1.52.23 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.21-2.57 5.14-5.01 5.41.39.34.74 1 .74 2.02v2.99c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z" />
  </svg>
)

const PinIcon = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const Spark = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const MenuIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const CloseIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

/* ------------------------------------------------------------------ hooks */

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

function LocalClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: profile.timezone,
        }).format(new Date()),
      )
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])
  return <span className="clock">{time || '--:--'} WAT</span>
}

/* --------------------------------------------------------------- sections */

function Navigation() {
  const [open, setOpen] = useState(false)
  const links = [
    ['Work', '#work'],
    ['Now', '#now'],
    ['Stack', '#stack'],
    ['About', '#about'],
  ]

  return (
    <header className="nav-shell">
      <a className="brand" href="#top" aria-label={`${profile.name}, back to top`}>
        <span className="brand-mark">{profile.initials}</span>
        <span className="brand-text">
          <strong>{profile.name}</strong>
          <small>AI engineering</small>
        </span>
      </a>

      <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main navigation">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <a className="nav-github" href={profile.github} target="_blank" rel="noreferrer">
          <GithubIcon size={15} /> GitHub <ArrowUpRight size={13} />
        </a>
      </nav>

      <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
    </header>
  )
}

function Hero({ projects }: { projects: Project[] }) {
  const deployed = projects.filter((p) => p.status.toLowerCase().includes('deployed')).length

  return (
    <section className="hero" id="top">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow" data-reveal>
            <span className="pulse-dot" /> {profile.availability}
          </p>
          <h1 data-reveal style={{ transitionDelay: '80ms' }}>
            Building AI systems
            <br />
            that <span className="text-accent">actually ship.</span>
          </h1>
          <p className="hero-lead" data-reveal style={{ transitionDelay: '160ms' }}>
            {profile.intro}
          </p>
          <div className="hero-actions" data-reveal style={{ transitionDelay: '240ms' }}>
            <a href="#work" className="btn btn-primary">
              Explore the work <ArrowUpRight />
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <GithubIcon size={16} /> GitHub profile
            </a>
          </div>
          <div className="hero-meta" data-reveal style={{ transitionDelay: '300ms' }}>
            <span><PinIcon /> {profile.location}</span>
            <span className="meta-divider" />
            <LocalClock />
          </div>
        </div>

        <aside className="hero-panel" data-reveal style={{ transitionDelay: '200ms' }} aria-label="At a glance">
          <div className="panel-head">
            <span className="panel-label">SYSTEM / PROFILE</span>
            <span className="panel-live"><span className="pulse-dot" /> LIVE</span>
          </div>
          <div className="panel-role">
            <span className="panel-role-label">CURRENT TRACK</span>
            <strong>{profile.role}</strong>
            <span className="panel-role-sub">{profile.discipline}</span>
          </div>
          <div className="panel-stats">
            <div><strong>{String(projects.length).padStart(2, '0')}</strong><span>Projects</span></div>
            <div><strong>{String(deployed).padStart(2, '0')}</strong><span>Deployed</span></div>
            <div><strong>05</strong><span>Focus areas</span></div>
          </div>
          <div className="panel-log">
            <p><span className="log-key">status</span> <span className="log-val">building · learning · shipping</span></p>
            <p><span className="log-key">focus</span> <span className="log-val">LLM workflows, APIs, CI/CD</span></p>
            <p><span className="log-key">mode</span> <span className="log-val">collaborative engineering</span></p>
          </div>
        </aside>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <span className="scroll-line" />
      </div>
    </section>
  )
}

function Marquee({ projects }: { projects: Project[] }) {
  const tags = Array.from(new Set(projects.flatMap((p) => p.tech))).slice(0, 16)
  const strip = [...tags, ...tags]
  return (
    <div className="marquee" aria-label="Technologies worked with">
      <div className="marquee-track">
        {strip.map((tag, i) => (
          <span key={`${tag}-${i}`}>
            <span className="marquee-dot" /> {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project-card animate-in" data-accent={project.accent} style={{ animationDelay: `${(index % 3) * 70}ms` }}>
      <div className="card-top">
        <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="card-category">{project.category}</span>
        <span className={`status-pill ${project.status.toLowerCase().includes('deployed') ? 'deployed' : ''}`}>
          <span className="status-dot" /> {project.status}
        </span>
      </div>

      <div className="card-body">
        <h3>{project.title}</h3>
        <p className="card-subtitle">{project.subtitle}</p>
        <p className="card-summary">{project.summary}</p>

        <ul className="card-highlights">
          {project.highlights.slice(0, 3).map((point) => (
            <li key={point}>{point}</li>
          ))}
          {project.highlights.length > 3 && <li className="more-points">+{project.highlights.length - 3} more in the repo</li>}
        </ul>
      </div>

      <div className="card-foot">
        <div className="tech-row">
          {project.tech.slice(0, 6).map((tech) => (
            <span key={tech} className="tech-chip">{tech}</span>
          ))}
          {project.tech.length > 6 && <span className="tech-chip">+{project.tech.length - 6}</span>}
        </div>
        <div className="card-links">
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noreferrer" aria-label={`Open live demo for ${project.title}`}>
              Live app <ArrowUpRight size={14} />
            </a>
          )}
          {project.repo && (
            <a href={project.repo} target="_blank" rel="noreferrer" aria-label={`Open repository for ${project.title}`}>
              Repository <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function Work({ projects }: { projects: Project[] }) {
  const available = useMemo(() => {
    const present = CATEGORIES.filter((c) => projects.some((p) => p.category === c))
    const others = Array.from(new Set(projects.map((p) => p.category))).filter((c) => !present.includes(c as Category))
    return ['All work', ...present, ...others]
  }, [projects])
  const [filter, setFilter] = useState('All work')

  const visible = filter === 'All work' ? projects : projects.filter((p) => p.category === filter)

  return (
    <section className="section work-section" id="work">
      <div className="section-head" data-reveal>
        <div>
          <p className="section-kicker"><span className="kicker-line" /> 01 / SELECTED WORK</p>
          <h2>Projects with <em>proof of work.</em></h2>
        </div>
        <p className="section-intro">
          A selection of collaborative builds, deployed applications and systems currently in flight. Every project below comes from hands-on work — not a tutorial.
        </p>
      </div>

      <div className="filters" data-reveal role="group" aria-label="Filter projects">
        {available.map((cat) => (
          <button key={cat} className={filter === cat ? 'active' : ''} onClick={() => setFilter(cat)} aria-pressed={filter === cat}>
            {cat}
            <span>{cat === 'All work' ? projects.length : projects.filter((p) => p.category === cat).length}</span>
          </button>
        ))}
      </div>

      <div className="project-grid" key={filter}>
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} index={projects.indexOf(project)} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="empty-state">No projects in this category yet.</p>
      )}
    </section>
  )
}

function Now({ projects }: { projects: Project[] }) {
  const current = projects.filter((p) => !p.status.toLowerCase().includes('deployed')).slice(0, 3)
  const items = current.length ? current : projects.slice(0, 3)

  return (
    <section className="section now-section" id="now">
      <div className="now-inner">
        <div className="now-heading" data-reveal>
          <p className="section-kicker"><span className="kicker-line" /> 02 / CURRENTLY BUILDING</p>
          <h2>Where the work is <em>happening now.</em></h2>
          <p>Active projects move fastest when the context is visible. Here's what I'm currently contributing to and learning from.</p>
          <a href={profile.github} target="_blank" rel="noreferrer" className="text-link">
            Follow the commits <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="now-list">
          {items.map((project, i) => (
            <a
              key={project.id}
              className="now-item"
              data-accent={project.accent}
              href={project.repo || project.demo || profile.github}
              target="_blank"
              rel="noreferrer"
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="now-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="now-content">
                <strong>{project.title}</strong>
                <small>{project.role}</small>
              </span>
              <span className="now-status">{project.status}</span>
              <ArrowUpRight size={18} />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stack() {
  return (
    <section className="section stack-section" id="stack">
      <div className="section-head" data-reveal>
        <div>
          <p className="section-kicker"><span className="kicker-line" /> 03 / TOOLKIT</p>
          <h2>The stack I <em>work with.</em></h2>
        </div>
        <p className="section-intro">Honest capability map — from foundations I'm developing to tools I've already used in shipped and collaborative work.</p>
      </div>

      <div className="stack-grid">
        {stack.map((group, i) => (
          <div className="stack-card" key={group.title} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
            <div className="stack-card-head">
              <span className="stack-num">0{i + 1}</span>
              <Spark />
            </div>
            <h3>{group.title}</h3>
            <p className="stack-note">{group.note}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item}><span /> {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function About() {
  return (
    <section className="section about-section" id="about">
      <div className="section-head" data-reveal>
        <div>
          <p className="section-kicker"><span className="kicker-line" /> 04 / BACKGROUND</p>
          <h2>Beyond the <em>editor.</em></h2>
        </div>
        <p className="section-intro">A non-linear route into engineering — mass communication, operations and a deliberate move into applied AI.</p>
      </div>

      <div className="about-grid">
        <div className="about-main">
          <div className="timeline" data-reveal>
            {experience.map((job) => (
              <div className="timeline-item" key={job.org}>
                <span className="timeline-dot" />
                <div className="timeline-meta">
                  <span>{job.period}</span>
                  <span>{job.place}</span>
                </div>
                <h3>{job.role}</h3>
                <p className="timeline-org">{job.org}</p>
                <ul>
                  {job.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="edu-block" data-reveal>
            <p className="mini-label">EDUCATION</p>
            {education.map((ed) => (
              <div key={ed.title}>
                <h3>{ed.title}</h3>
                <p>{ed.org} · {ed.period} · {ed.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="about-side">
          <div className="side-card" data-reveal>
            <p className="mini-label">CERTIFICATIONS</p>
            <ul className="cert-list">
              {certifications.map((cert) => <li key={cert}>{cert}</li>)}
            </ul>
          </div>
          <div className="side-card" data-reveal style={{ transitionDelay: '80ms' }}>
            <p className="mini-label">INTERESTS</p>
            <div className="interest-cloud">
              {interests.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="section contact-section" id="contact">
      <div className="contact-glow" aria-hidden="true" />
      <div className="contact-inner" data-reveal>
        <p className="section-kicker"><span className="kicker-line" /> 05 / CONTACT</p>
        <h2>Let's build something <em>reliable.</em></h2>
        <p className="contact-copy">
          I'm looking for an AI Engineering Internship and collaborations where practical AI meets solid engineering. If that sounds like your world, let's talk.
        </p>
        <div className="contact-actions">
          <a href={profile.github} target="_blank" rel="noreferrer" className="btn btn-primary">
            <GithubIcon size={17} /> Connect on GitHub <ArrowUpRight />
          </a>
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="btn btn-ghost">
              {profile.email} <ArrowUpRight />
            </a>
          )}
        </div>
        <div className="contact-foot">
          <span><PinIcon /> {profile.location}</span>
          <span><Spark /> {profile.availability}</span>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <a className="footer-brand" href="#top">
        <span className="brand-mark">{profile.initials}</span>
        <span>{profile.name}</span>
      </a>
      <p>Designed & built with intent · {new Date().getFullYear()}</p>
      <a href="/studio.html" className="footer-studio">Content studio <ArrowUpRight size={12} /></a>
    </footer>
  )
}

export default function App() {
  const projects = useProjects()
  useReveal()

  return (
    <div className="site">
      <Navigation />
      <main>
        <Hero projects={projects} />
        <Marquee projects={projects} />
        <Work projects={projects} />
        <Now projects={projects} />
        <Stack />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
