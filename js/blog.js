// Blog page: every post in data/posts.json, newest first
(async function () {
  const box = document.getElementById("post-list");
  try {
    const posts = await loadJSON("data/posts.json");
    posts.sort((a, b) => b.date.localeCompare(a.date));
    box.innerHTML = posts.map(postHTML).join("") || "No posts yet.";
  } catch (e) { box.textContent = "Could not load posts. Use a local server (see README)."; }
})();
