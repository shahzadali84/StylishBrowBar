# Stylish Brow Bar website (GitHub Pages)

Static HTML + one shared stylesheet (`styles.css`). No build step.

## File structure = your current URLs

| File | Live URL (same as your Google Sites address) |
|---|---|
| `index.html` | `/` |
| `home.html` | `/home` (redirects to `/`) |
| `book.html` | `/book` |
| `services.html` | `/services` |
| `services/threading.html` | `/services/threading` |
| `services/brows.html` | `/services/brows` |
| `services/waxing.html` | `/services/waxing` |
| `services/lashes.html` | `/services/lashes` |
| `reviews.html` | `/reviews` |
| `contact.html` | `/contact` |
| `404.html` | shown for any unknown address |

GitHub Pages serves `book.html` at `/book` automatically. **Don't rename these files**, or the old addresses will break.

## Preview (staging)

1. Create a GitHub repo (e.g. `stylish-brow-bar`) and upload everything in this folder.
2. Repo **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.
3. Preview at `https://YOUR-USERNAME.github.io/stylish-brow-bar/`.

Notes: opening the files by double-click won't work for page links (they have no `.html`). Use the GitHub Pages preview. The `404.html` page may show unstyled on the github.io preview, but works on your own domain.

Every page has `<meta name="robots" content="noindex">` so Google ignores the preview.

## Things to fill in or check

- `reviews.html`: replace the 3 **placeholder reviews** with real ones, and the "Read more reviews on Google" link (`href="#"`).
- `book.html`: confirm the booking calendar shows. If it's blank, paste the embed code from your Acuity account instead.
- Prices and times: edit the text in `<span class="time">` and `<span class="price">`.
- Colours and fonts: the variables at the top of `styles.css`.
- Optional: add a logo/photo and an `"image"` line in the JSON-LD on `index.html` and `contact.html`.
- Confirm the address spelling matches your Google Business Profile exactly (we use "Gloucester (Ottawa), ON K1T 0M6" on pages and "Ottawa" in the schema).

## Going live (keep your Google rankings)

Do these in order, and don't turn off the old Google Sites page until step 5 works.

1. **Remove `noindex`.** Search every file for `<meta name="robots" content="noindex">` and delete that line (in all 11 `.html` files, including `404.html` and `home.html`). This is the step people forget, and without it Google drops the site.
2. Add a file named `CNAME` (no extension) containing one line: `www.stylishbrowbar.ca`. In **Settings > Pages**, set the custom domain to `www.stylishbrowbar.ca`.
3. At your domain registrar's DNS settings:
   - `www` → CNAME → `YOUR-USERNAME.github.io`
   - Apex `stylishbrowbar.ca` → four A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Remove the old Google Sites records.
4. In Settings > Pages tick **Enforce HTTPS** (may take up to an hour after DNS updates).
5. Open each old URL (`/book`, `/reviews`, `/services/threading`, etc.) and confirm it loads.
6. In Google Search Console: verify the domain, submit `https://www.stylishbrowbar.ca/sitemap.xml`, and use URL Inspection > Request Indexing on the home page.
7. Check Search Console's Pages report weekly for the first month.
