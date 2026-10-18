# Portfolio
My portfolio 
## Run locally
For tesing,
```bash
    python -m http.server 8000
```
then open `http://localhost:8000`

## Add a project
Add an entry to `data/projects.json`. Only `repo` is required:

    { "repo": "yourname/my-repo", "date": "2026-10-17" }

Title, description and tags are taken from the GitHub repo if you leave them out
(set them in the file to override). The project page shows the repo's README.
Optional fields: "branch", "readme" (file name), "demo" (URL), "post" (blog slug).
The newest "date" becomes the "Latest project" on the home page.
Repos must be public.

## Add a blog post
1. Save `posts/my-post.md`
2. Add to `data/posts.json`: slug (same as file name), title, date, summary, tags.
To load a post from another repo, add "source": "https://raw.githubusercontent.com/user/repo/main/docs/post.md".


