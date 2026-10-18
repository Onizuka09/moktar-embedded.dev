// Project page: project.html?repo=user/repo -> that repo's README, fetched from GitHub.
// Only repos listed in data/projects.json are allowed.
(async function () {
  const box = document.getElementById("content");
  const repo = new URLSearchParams(location.search).get("repo");
  try {
    const projects = await loadJSON("data/projects.json");
    const p = projects.find(x => x.repo === repo);
    if (!p) throw new Error("Project not found");
    await fillFromGitHub([p]);
    document.title = p.title + " – " + SITE.name;
    document.getElementById("title").textContent = p.title;
    document.getElementById("meta").innerHTML =
      `<a href="https://github.com/${esc(p.repo)}">View on GitHub</a>` +
      (p.demo ? ` <a href="${esc(p.demo)}">Demo</a>` : "") +
      (p.post ? ` <a href="post.html?slug=${esc(p.post)}">Blog post</a>` : "");

    // Try the chosen branch first, then main, then master.
    const file = p.readme || "README.md";
    const branches = [p.branch, "main", "master"].filter(Boolean);
    for (const branch of branches) {
      const raw = `https://raw.githubusercontent.com/${p.repo}/${branch}/`;
      const res = await fetch(raw + file);
      if (res.ok) {
        const blob = `https://github.com/${p.repo}/blob/${branch}/`;
        showMarkdown(box, await res.text(), { raw, blob });
        return;
      }
    }
    throw new Error("Could not find " + file + " in " + p.repo + " (is the repo public?)");
  } catch (e) { box.textContent = e.message; }
})();
