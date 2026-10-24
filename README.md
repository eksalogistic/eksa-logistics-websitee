# EKSA Logistics Website

A complete seven-section static marketing website designed for free GitHub Pages hosting.

## Preview
Open `index.html` in a browser, or upload the folder to a GitHub repository and enable GitHub Pages from the repository root. Navigation uses hash routes so all seven pages work on static hosting.

## Before publishing
1. **Forms are preview-only.** The business, pharmacy, driver and contact forms currently validate inputs but do not transmit or save anything. Connect Google Forms or a secure form service, test each submission, and add a privacy notice before launching.
2. Replace stock Unsplash photos with approved licensed company photos if desired. The sample photos are loaded from external URLs and need an internet connection.
3. Confirm all service descriptions, service areas, company contact details and delivery claims.
4. Add a privacy policy and any necessary terms. Never collect prescription or patient details in a public form.
5. The provided logo is the user-supplied artwork. Consider replacing it with a transparent PNG/SVG version for best display.

## Publish with GitHub Pages
1. Create a public repository on GitHub (for example `eksa-website`).
2. Upload `index.html`, `styles.css`, `script.js`, `assets/eksa-logo.jpg` and `CNAME` to the root.
3. Go to Settings > Pages > Build and deployment > Deploy from a branch; select `main` and `/ (root)`.
4. Test the GitHub Pages URL and all navigation links before touching the current domain.
5. In GitHub Pages settings, configure custom domain `www.eksalogistic.ca` and follow the current GitHub instructions for DNS (typically a `www` CNAME to `<username>.github.io`). Keep the existing site live until ready to switch. Avoid changing MX/email records. Enable HTTPS when available.
6. Verify the custom domain and test HTTPS and all pages after DNS propagation.

## Structure
- `index.html` — shared header, footer and app shell
- `styles.css` — responsive styling
- `script.js` — all seven pages, routing and demo forms
- `assets/eksa-logo.jpg` — supplied logo
- `CNAME` — planned custom domain

This is a static public website, not the secure EKSA MedConnect pharmacy delivery application.
