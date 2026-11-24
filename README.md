# Emeto Golden — Portfolio

A dark, editorial portfolio for AI engineering work, with a built-in **Content Studio** so new projects can be added from a browser form — no code edits required.

## What's here

| Path | Purpose |
| --- | --- |
| `content/projects.json` | The single source of truth for projects (title, summary, tech, links, highlights, order). |
| `src/profile.ts` | Bio, location, links, stack, experience, education, certifications. Edit this only when those change. |
| `studio.html` + `src/studio.tsx` | Private `/studio.html` page: add, edit, reorder, import/export and publish projects. |
| `src/App.tsx`, `src/styles.css` | The public portfolio. |

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL for the site, and `/studio.html` for the studio. Changes made in the studio are saved in that browser immediately, so the site reflects them on reload.

## Deploy to Vercel

1. Create a GitHub repository from this folder and push it.
2. In Vercel → **Add New → Project**, import that repository. Vercel detects Vite automatically (`npm run build`, output `dist`).
3. Deploy. The site will be live at your Vercel URL; point your existing domain or replace the old portfolio link there.

## Set up no-code publishing (one-time, ~5 minutes)

The studio writes `content/projects.json` to GitHub through the GitHub API. Vercel sees the commit and rebuilds the site automatically.

1. **Create a fine-grained personal access token**
   - GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens → Generate new token**.
   - Name it something like `Portfolio content studio`.
   - Resource owner: your personal account. Repository access: **Only select repositories** → the portfolio repo.
   - Permissions → Repository permissions → **Contents: Read and write**.
   - Generate and copy the token. It starts with `github_pat_`.
2. **Open `https://your-site.vercel.app/studio.html`**
3. Click **Connection settings**, enter:
   - **Token**: the token from step 1
   - **Repository**: `your-github-name/your-repo-name`
   - **Branch**: `main` (or your default branch)
4. Click **Connect**, then **Pull latest** to load the published content.

These settings stay in that browser's local storage. The token is never included in the site build.

## Add a project later

1. Open `/studio.html` on your site.
2. Click **+ Add**, fill in the form (highlights and tech are one item per line), and use **Move up/down** to set the order.
3. Changes appear in the site preview immediately (saved locally in your browser).
4. Click **Publish to GitHub**. Wait for Vercel's deploy to finish — the new project is live.

If you're on a different device, the studio settings won't be there; enter the token and repo once on that device too. You can also use **Export JSON** / **Import JSON** to move content between browsers.

## Content schema

```json
{
  "id": "slug-for-the-project",
  "title": "Project name",
  "subtitle": "One-line descriptor",
  "category": "AI & LLM",
  "status": "In progress",
  "role": "Your role on the project",
  "summary": "Two or three sentences.",
  "highlights": ["Specific contribution", "Another contribution"],
  "tech": ["Python", "FastAPI"],
  "repo": "https://github.com/…",
  "demo": "https://…",
  "accent": "mint",
  "featured": true
}
```

- `category`: `AI & LLM`, `Backend & APIs`, `Full-stack`, `DevOps & CI/CD` (or any new label — filters adapt automatically).
- `accent`: `mint`, `blue`, `violet`, `amber`, `cyan`.
- `status`: free text. Anything containing “Deployed” gets the green treatment.
- `featured`: reserved for future curated views; all projects currently show.

## Notes

- The contact email is intentionally blank because it wasn't in the CV. Add it in `src/profile.ts` (`email: 'you@example.com'`) to reveal the email button, then redeploy.
- The site reads local studio edits first and falls back to `content/projects.json`, so published visitors always see the committed content.
- No external fonts or scripts are required; everything works offline and in the preview sandbox.
