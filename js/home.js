// Home: latest project + latest 2 posts
(async function () {
  const projBox = document.getElementById("latest-project");
  const postBox = document.getElementById("latest-posts");
  try {
    const projects = await loadJSON("data/projects.json");
    projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const latest = await fillFromGitHub(projects.slice(0, 1));
    projBox.innerHTML = latest.map(projectHTML).join("") || "No projects yet.";
  } catch (e) { projBox.textContent = "Could not load projects. Use a local server (see README)."; }
  try {
    const posts = await loadJSON("data/posts.json");
    posts.sort((a, b) => b.date.localeCompare(a.date));
    postBox.innerHTML = posts.slice(0, 2).map(postHTML).join("") || "No posts yet.";
  } catch (e) { postBox.textContent = "Could not load posts."; }
})();
