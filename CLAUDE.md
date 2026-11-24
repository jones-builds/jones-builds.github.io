# Portfolio site — conventions

Personal portfolio hosted on GitHub Pages at https://jones-builds.github.io (served from `main`, repo root).

## No-build static site
- Plain HTML/CSS/JS only. No build step, bundler, framework, package.json, or generated files.
- What's in the repo is exactly what GitHub Pages serves. Keep every path relative so the site also works when opened locally through a static server.
- Don't add dependencies. The only external resource is Google Fonts.

## Structure
```
/
├── index.html              homepage (sections #projects, #lab, #contact)
├── resume.pdf              linked from index.html (add the file manually; it's not in the repo yet)
├── projects/
│   ├── project.css         shared by all project pages
│   ├── project.js          shared by all project pages (widgets, lightbox, theme)
│   └── <name>.html         one page per project
└── images/
    └── <name>/             one folder per project, same <name> as the page
        ├── README.txt      keeps the folder in git; tells you what to drop in
        ├── cover.jpg       homepage card + top of the project page
        └── 1.jpg … 8.jpg   gallery
```

Project names, in homepage order (prev/next links follow this order and loop around):
rapid-hand, cnc-scrap, qr-sorting-arm, turtlebot-nav, ir-ball-robot, pump-classifier, hyundai-engine, foldable-frame, water-robot

## Paths
- `index.html`: cards link to `projects/<name>.html`, and covers are `images/<name>/cover.jpg`.
- `projects/<name>.html`:
  - home links are `../index.html`, `../index.html#projects`, `#lab` and `#contact`
  - cover is `../images/<name>/cover.jpg`
  - gallery is `../images/<name>/1.jpg` … `8.jpg`
  - prev/next links are bare `<other>.html`
  - styles and scripts load from `project.css` and `project.js` in the same folder

## Image naming and fallback
- Exact names: `cover.jpg`, `1.jpg` … `8.jpg`. A `.png` with the same base name also works.
- Fallback: a failed `.jpg` retries once as `.png`. If that fails too, the image removes itself. On project pages an empty gallery hides its whole section.
  - Homepage: inline `onerror` on each card `<img>`.
  - Project pages: `onerror="__imgFail(this)"`. `window.__imgFail` is defined in an inline `<script>` in `<head>` so it exists before any image can fail. Keep it there and don't move it into `project.js`.
- Adding photos needs no code changes. Keep images around 1600 px wide and under about 500 KB.

## Adding a project
1. Copy an existing `projects/<name>.html` and update its content, image paths and prev/next links.
2. Create `images/<new-name>/README.txt`.
3. Add a card to `index.html` and update the prev/next links on the neighbouring pages.
