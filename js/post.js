// Post page: post.html?slug=my-post  ->  posts/my-post.md  (or the "source" URL in posts.json)
(async function () {
  const box = document.getElementById("content");
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const posts = await loadJSON("data/posts.json");
    const post = posts.find(p => p.slug === slug);
    if (!post) throw new Error("Post not found");
    const url = post.source || `posts/${post.slug}.md`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Markdown file not found: " + url);
    const dir = url.slice(0, url.lastIndexOf("/") + 1);      // for relative images
    document.title = post.title + " – " + SITE.name;
    document.getElementById("title").textContent = post.title;
    document.getElementById("meta").textContent = post.date;
    showMarkdown(box, await res.text(), { raw: dir, blob: dir });
  } catch (e) { box.textContent = e.message; }
})();
