/**
 * Portfolio loader
 *
 * If the page URL has ?portfolio=<name>, fetch /portfolios/<name>/manifest.json
 * and inject real photos + artist data into the theme.
 *
 * Conventions (use these in HTML):
 *   <div data-photo-slot="0"></div>          ← background-image goes here
 *   <span data-photo-title="0"></span>       ← replaced with photo title
 *   <span data-photo-price="0"></span>       ← replaced with photo price
 *   <span data-photo-location="0"></span>    ← replaced with photo location
 *   <span data-photo-year="0"></span>        ← replaced with photo year
 *   <span data-field="name"></span>          ← artist field (name, tagline, bio_*, location, email, etc.)
 *   <h1 data-field-html="hero_title"></h1>   ← same, but renders as HTML (allows <em>, <br>)
 *
 * When no ?portfolio is present, the script does nothing and the theme
 * renders with its placeholder gradients + demo copy.
 */

(async function () {
  const params = new URLSearchParams(location.search);
  const name = params.get('portfolio');
  if (!name) return;

  let data;
  try {
    const res = await fetch(`/portfolios/${name}/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.warn(`[portfolio-loader] failed to load "${name}":`, err);
    return;
  }

  const photos = data.photos || [];
  const artist = data.artist || {};

  // Artist fields — plain text
  document.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    if (artist[key] != null) el.textContent = artist[key];
  });

  // Artist fields — HTML-safe (intentional: our own manifest)
  document.querySelectorAll('[data-field-html]').forEach(el => {
    const key = el.dataset.fieldHtml;
    if (artist[key] != null) el.innerHTML = artist[key];
  });

  // Photo backgrounds
  document.querySelectorAll('[data-photo-slot]').forEach(el => {
    const slot = parseInt(el.dataset.photoSlot, 10);
    const photo = photos[slot];
    if (!photo) {
      // Hide if no photo available
      const card = el.closest('[data-photo-card]');
      if (card) card.style.display = 'none';
      return;
    }
    // encodeURI handles spaces and unicode in filenames, preserves "/"
    const url = `/portfolios/${encodeURIComponent(name)}/${encodeURI(photo.file)}`;
    // clear any "fake" gradient background first
    el.style.background = `url("${url}") center/cover no-repeat`;
  });

  // Photo text fields
  const textFields = ['title', 'price', 'location', 'year'];
  textFields.forEach(field => {
    document.querySelectorAll(`[data-photo-${field}]`).forEach(el => {
      const slot = parseInt(el.dataset[`photo${field[0].toUpperCase() + field.slice(1)}`], 10);
      const photo = photos[slot];
      if (photo && photo[field] != null) el.textContent = photo[field];
    });
  });

  // Propagate ?portfolio= to same-store navigation (theme switches, etc.)
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    // only rewrite local links (ignore http(s):, mailto:, anchors, absolute paths)
    if (/^(https?:|mailto:|tel:|#|\/)/.test(href)) return;
    const sep = href.includes('?') ? '&' : '?';
    a.setAttribute('href', `${href}${sep}portfolio=${encodeURIComponent(name)}`);
  });

  // Tag the <body> so themes can adjust if needed
  document.body.dataset.portfolio = name;
  document.title = `${artist.name || name} — ${document.title}`;
})();
