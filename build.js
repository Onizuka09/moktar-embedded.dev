// Turns your markdown (posts and project READMEs) into real HTML pages,
// so search engines and link previews (LinkedIn, X) can read them.
//
// Run:  npm install   (once)
//       npm run build
// Output: blog/<slug>/index.html, projects/<repo>/index.html,
//         sitemap.xml, feed.xml, robots.txt
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const hljs = require("highlight.js");

// ===== Edit these (keep name/github in sync with js/common.js) =====
const CONFIG = {
  siteUrl: "https://Onizuka09.github.io/portfolio",   // no trailing slash
  name: "Moktar SELLAMI",
  github: "Onizuka09",
  description: "Embedded systems engineer: firmware, embedded security, robotics and embedded Linux."
};

// ---------- helpers ----------
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const readJSON = f => JSON.parse(fs.readFileSync(f, "utf8"));
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
async function getText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
// github.com/.../blob/... -> raw.githubusercontent.com/...
const toRawUrl = u => u.replace(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\//,
  "https://raw.githubusercontent.com/$1/");
// folder on raw.githubusercontent.com -> same folder on github.com (for relative links)
function rawToBlobDir(dir) {
  const m = dir.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\/(.+)$/);
  return m ? `https://github.com/${m[1]}/blob/${m[2]}` : dir;
}

// ---------- markdown ----------
let seen = {};   // heading ids used so far in the current document
marked.use({
  renderer: {
    code(code, infostring) {                       // syntax highlighting at build time
      const lang = (infostring || "").match(/^\S*/)[0];
      const known = lang && hljs.getLanguage(lang);
      const html = known ? hljs.highlight(code, { language: lang }).value : esc(code);
      return `<pre><code class="hljs${known ? " language-" + lang : ""}">${html}</code></pre>\n`;
    },
    heading(text, level, raw) {                    // ids so #links to headings work
      const base = raw.toLowerCase().replace(/[^\w\- ]+/g, "").trim().replace(/ +/g, "-") || "section";
      const n = seen[base] = (seen[base] || 0) + 1;        // repeated headings get -1, -2, ...
      const id = n === 1 ? base : `${base}-${n - 1}`;
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    }
  }
});

// base = { raw, link }: where relative images / relative links should point
function markdownToHtml(md, base) {
  md = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")   // front matter
         .replace(/^\s*#\s+.+\r?\n/, "");                  // leading "# Title" (page shows its own)
  const isRelative = u => u && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
  const clean = u => u.replace(/^\.?\//, "");
  seen = {};
  const html = marked.parse(md).replace(/\b(src|href)="([^"]*)"/g, (m, attr, url) =>
    isRelative(url) ? `${attr}="${attr === "src" ? base.raw : base.link}${clean(url)}"` : m);
  // table of contents for the sidebar: every h1-h3 that has an id
  const toc = [...html.matchAll(/<h([1-3]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)]
    .map(m => ({ level: +m[1], id: m[2], text: m[3].replace(/<[^>]+>/g, "") }));
  return { html, toc };
}

// ---------- page template ----------
function page({ depth, title, description, urlPath, body, active, extraHead = "", toc = [] }) {
  const p = "../".repeat(depth);                  // path back to the site root
  const url = `${CONFIG.siteUrl}/${urlPath}`;
  const fullTitle = `${title} – ${CONFIG.name}`;
  const nav = [["Portfolio", "index.html", ""], ["Projects", "projects.html", "projects"],
               ["Blog", "blog.html", "blog"], ["Contact", "index.html#contact", ""]]
    .map(([label, href, key]) =>
      `<a href="${p}${href}"${key && key === active ? ' class="active"' : ""}>${label}</a>`).join("");
  const sidebar = toc.length > 1 ? `<aside class="sidebar"><nav id="side-nav" aria-label="On this page">
${toc.map(t => `<a href="#${t.id}"${t.level === 3 ? ' class="sub"' : ""}>${t.text}</a>`).join("\n")}
</nav></aside>` : "";
  const main = `<main>\n${body}\n</main>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:site_name" content="${esc(CONFIG.name)}">
  <meta name="twitter:card" content="summary">
  <link rel="alternate" type="application/rss+xml" title="${esc(CONFIG.name)} – Blog" href="${p}feed.xml">
  <link rel="stylesheet" href="${p}css/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" media="(prefers-color-scheme: light)">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
${extraHead}
</head>
<body${sidebar ? ' class="wide"' : ""}>
<header class="site-header"><a class="logo" href="${p}index.html">${esc(CONFIG.name)}</a><nav>${nav}</nav></header>
${sidebar ? `<div class="layout">\n${sidebar}\n${main}\n</div>` : main}
<footer>© ${new Date().getFullYear()} ${esc(CONFIG.name)} · <a href="https://github.com/${esc(CONFIG.github)}">GitHub</a></footer>
${sidebar ? `<script src="${p}js/sidebar.js"></script>` : ""}
</body>
</html>
`;
}

// ---------- posts ----------
async function buildPosts(sitemap) {
  const posts = readJSON("data/posts.json").sort((a, b) => b.date.localeCompare(a.date));
  for (const post of posts) {
    if (!/^[\w.-]+$/.test(post.slug)) throw new Error("Bad slug: " + post.slug);
    let md, base;
    if (post.source) {
      const url = toRawUrl(post.source);
      md = await getText(url);
      const dir = url.slice(0, url.lastIndexOf("/") + 1);
      base = { raw: dir, link: rawToBlobDir(dir) };
    } else {
      md = fs.readFileSync(`posts/${post.slug}.md`, "utf8");
      base = { raw: "../../posts/", link: "../../posts/" };
    }
    const { html, toc } = markdownToHtml(md, base);
    const urlPath = `blog/${post.slug}/`;
    const tags = (post.tags || []).map(t => `<span>${esc(t)}</span>`).join("");
    const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
      description: post.summary, datePublished: post.date,
      author: { "@type": "Person", name: CONFIG.name }, mainEntityOfPage: `${CONFIG.siteUrl}/${urlPath}` };
    write(`${urlPath}index.html`, page({
      depth: 2, toc, active: "blog", urlPath, title: post.title, description: post.summary,
      extraHead: `  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
      body: `<article>
  <h1>${esc(post.title)}</h1>
  <div class="meta">${esc(post.date)}</div>
  <div class="tags">${tags}</div>
  <div class="prose">${html}</div>
</article>`
    }));
    sitemap.push({ path: urlPath, date: post.date });
    console.log("post:   ", post.slug);
  }
  return posts;
}

// ---------- projects ----------
async function repoInfo(repo) {
  try {
    const headers = process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {};
    const res = await fetch("https://api.github.com/repos/" + repo, { headers });
    return res.ok ? res.json() : {};
  } catch { return {}; }
}

async function getReadme(p) {
  const file = p.readme || "README.md";
  for (const branch of [...new Set([p.branch, "main", "master"].filter(Boolean))]) {
    const raw = `https://raw.githubusercontent.com/${p.repo}/${branch}/`;
    const res = await fetch(raw + file);
    if (res.ok) return { md: await res.text(), raw, link: `https://github.com/${p.repo}/blob/${branch}/` };
  }
  return null;
}

async function buildProjects(sitemap) {
  for (const p of readJSON("data/projects.json")) {
    const name = p.repo.split("/")[1];
    const info = (p.title && p.description) ? {} : await repoInfo(p.repo);
    const title = p.title || name;
    const description = p.description || info.description || `${title}: a project by ${CONFIG.name}.`;
    const readme = await getReadme(p);
    if (!readme) console.warn(`WARNING: no README found for ${p.repo} (is it public?)`);
    const links = [`<a href="https://github.com/${esc(p.repo)}">View on GitHub</a>`];
    if (p.demo) links.push(`<a href="${esc(p.demo)}">Demo</a>`);
    if (p.post) links.push(`<a href="../../blog/${esc(p.post)}/">Blog post</a>`);
    const out = readme ? markdownToHtml(readme.md, readme) : { html: "<p>README not available.</p>", toc: [] };
    const urlPath = `projects/${name}/`;
    write(`${urlPath}index.html`, page({
      depth: 2, toc: out.toc, active: "projects", urlPath, title, description,
      body: `<article>
  <h1>${esc(title)}</h1>
  <div class="meta links">${links.join(" ")}</div>
  <div class="prose">${out.html}</div>
</article>`
    }));
    sitemap.push({ path: urlPath });
    console.log("project:", p.repo);
  }
}

// ---------- sitemap, feed, robots ----------
function writeSitemap(entries) {
  const urls = entries.map(e => `  <url><loc>${esc(CONFIG.siteUrl + "/" + e.path)}</loc>${
    e.date ? `<lastmod>${e.date}</lastmod>` : ""}</url>`).join("\n");
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}
function writeFeed(posts) {
  const items = posts.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${CONFIG.siteUrl}/blog/${p.slug}/</link>
    <guid>${CONFIG.siteUrl}/blog/${p.slug}/</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.summary)}</description>
  </item>`).join("\n");
  write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(CONFIG.name)} – Blog</title>
  <link>${CONFIG.siteUrl}/blog.html</link>
  <description>${esc(CONFIG.description)}</description>
${items}
</channel></rss>
`);
}

// ---------- run ----------
(async () => {
  const sitemap = [{ path: "" }, { path: "projects.html" }, { path: "blog.html" }];
  const posts = await buildPosts(sitemap);
  await buildProjects(sitemap);
  writeSitemap(sitemap);
  writeFeed(posts);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${CONFIG.siteUrl}/sitemap.xml\n`);
  console.log("Done.");
})().catch(err => { console.error("Build failed:", err.message); process.exit(1); });