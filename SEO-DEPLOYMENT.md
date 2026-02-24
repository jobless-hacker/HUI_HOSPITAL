# SEO Deployment Checklist (GitHub Pages)

1. Deploy to GitHub Pages and verify these URLs are public:
   - `/robots.txt`
   - `/sitemap.xml`
   - `/site.webmanifest`
2. Open Google Search Console and add your site property.
3. Submit your sitemap URL in Search Console (`https://jobless-hacker.github.io/web-vapt-2/sitemap.xml`).
4. Request indexing for:
   - `https://jobless-hacker.github.io/web-vapt-2/`
   - `https://jobless-hacker.github.io/web-vapt-2/doctors.html`
   - `https://jobless-hacker.github.io/web-vapt-2/departments.html`
   - `https://jobless-hacker.github.io/web-vapt-2/facilities.html`
   - `https://jobless-hacker.github.io/web-vapt-2/doctor-appointment-hyderabad.html`
   - `https://jobless-hacker.github.io/web-vapt-2/emergency-hospital-hyderabad.html`
   - `https://jobless-hacker.github.io/web-vapt-2/cardiology-hospital-hyderabad.html`
5. Keep the site online and unchanged for a few days while Google re-crawls.

## Notes
- Hash routes like `#doctors` are not separate crawlable pages in sitemaps.
- If you want each section to rank separately, create dedicated static URLs (`/doctors`, `/departments`, `/facilities`).
