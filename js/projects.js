// Projects page: every repo listed in data/projects.json
(async function () {
  const box = document.getElementById("project-list");
  try {
    const projects = await loadJSON("data/projects.json");
    projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    box.innerHTML = projects.map(p => projectHTML({ ...p, title: p.title || p.repo.split("/")[1] })).join("");
    await fillFromGitHub(projects);                         // fill gaps from GitHub, then redraw
    box.innerHTML = projects.map(projectHTML).join("") || "No projects yet.";
  } catch (e) { box.textContent = "Could not load projects. Use a local server (see README)."; }
})();
