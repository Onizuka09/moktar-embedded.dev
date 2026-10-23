// ===== Edit your details here (used by header, footer, links) =====
const SITE = {
  name: "Moktar SELLAMI",
  github: "https://github.com/Onizuka09",
  linkedin: "https://www.linkedin.com/in/moktar-sellami/",
  email: "smokthar925@gmail.com"
};

// ---------- Helpers ----------
function esc(text) {                       // makes text safe inside HTML
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Could not load " + path);
  return res.json();
}

// ---------- Header and footer (one place for every page) ----------
function buildLayout() {
  const page = location.pathname.split("/").pop() || "index.html";
  const links = [
    ["Portfolio", "index.html", ["index.html"]],
    ["Projects", "projects.html", ["projects.html", "project.html"]],
    ["Blog", "blog.html", ["blog.html", "post.html"]],
    ["Contact", "index.html#contact", []]
  ];
  const nav = links.map(([label, href, pages]) =>
    `<a href="${href}"${pages.includes(page) ? ' class="active"' : ""}>${label}</a>`).join("");
  const header = document.getElementById("site-header");
  if (header) header.innerHTML = `<a class="logo" href="index.html">${esc(SITE.name)}</a><nav>${nav}</nav>`;
  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = `© ${new Date().getFullYear()} ${esc(SITE.name)} ·
    <a href="https://github.com/${esc(SITE.github)}">GitHub</a>`;
}
buildLayout();

// ---------- Markdown (needs marked + highlight.js on the page) ----------
// base = { raw, blob } used to fix relative images/links (e.g. README images).
function showMarkdown(el, md, base) {
  md = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");      // drop front matter if present
  el.innerHTML = marked.parse(md);
  const relative = s => s && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(s);
  const clean = s => s.replace(/^\.?\//, "");
  if (base) {
    el.querySelectorAll("img").forEach(img => {
      const s = img.getAttribute("src");
      if (relative(s)) img.src = base.raw + clean(s);
    });
    el.querySelectorAll("a").forEach(a => {
      const s = a.getAttribute("href");
      if (relative(s)) a.href = base.blob + clean(s);
    });
  }
  el.querySelectorAll("pre code").forEach(b => hljs.highlightElement(b));
}

// ---------- Projects ----------
// If a project has no description/tags in projects.json, ask GitHub for them.
async function fillFromGitHub(projects) {
  await Promise.all(projects.map(async p => {
    p.title = p.title || p.repo.split("/")[1];
    if (p.description && p.tags) return;
    try {
      const res = await fetch("https://api.github.com/repos/" + p.repo);
      if (!res.ok) return;
      const info = await res.json();
      p.description = p.description || info.description || "";
      p.tags = p.tags || info.topics || [];
    } catch (e) { /* offline or rate-limited: just show what we have */ }
  }));
  return projects;
}

function projectHTML(p) {
  const tags = (p.tags || []).map(t => `<span>${esc(t)}</span>`).join("");
  const links = [`<a href="projects/${esc(p.repo.split("/")[1])}/">Read more</a>`,
                 `<a href="https://github.com/${esc(p.repo)}">Code</a>`];
  if (p.post) links.push(`<a href="blog/${esc(p.post)}/">Blog post</a>`);
  if (p.demo) links.push(`<a href="${esc(p.demo)}">Demo</a>`);
  return `<article class="item">
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.description)}</p>
    <div class="tags">${tags}</div>
    <div class="links">${links.join("")}</div></article>`;
}

function postHTML(p) {
  const tags = (p.tags || []).map(t => `<span>${esc(t)}</span>`).join("");
  return `<article class="item">
    <h3><a href="blog/${esc(p.slug)}/">${esc(p.title)}</a></h3>
    <div class="meta">${esc(p.date)}</div>
    <p>${esc(p.summary)}</p>
    <div class="tags">${tags}</div></article>`;
}