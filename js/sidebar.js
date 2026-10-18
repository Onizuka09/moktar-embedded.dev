// Highlights the sidebar link for the section currently on screen.
(function () {
  const links = [...document.querySelectorAll("#side-nav a")];
  const sections = links
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  function update() {
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= 120) current = s;   // last section past the top
    }
    // At the very bottom of the page, highlight the last section
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
      current = sections[sections.length - 1];
    }
    links.forEach(a =>
      a.classList.toggle("active", a.getAttribute("href") === "#" + current.id));
  }

  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  addEventListener("load", update);
  update();
})();