# Security hardening checklist

## Already implemented in code
- Removed inline handlers/scripts from HTML and switched Tailwind to a compiled stylesheet (`tailwind.generated.css`) built from local source.
- Switched third-party runtime assets to local vendored files where applicable:
  - `vendor/fontawesome/css/all.min.css`
  - `vendor/fontawesome/webfonts/*`
- Added CSP + referrer meta tags in `index.html` as fallback.
- Replaced high-risk dynamic HTML generation paths with safer DOM APIs for toast/footer/form rendering.
- Stopped persisting booking PII in `localStorage`.
- Stopped retaining appointment payloads in long-lived in-memory app state after submit.
- Propagated validation constraints (`min`, `max`, `pattern`, `maxlength`, etc.) from form template to generated controls.
- Added submit-time payload validation/normalization before booking API invocation.
- Fixed doctor card booking action binding via delegated listeners (`data-doc-id`) and enabled doctor search filtering.

## Required at deployment (HTTP headers)
Use one of the provided configs:
- `netlify.toml` for Netlify
- `vercel.json` for Vercel

If using another host, set equivalent headers:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options` (or `frame-ancestors` in CSP)
- `Referrer-Policy`
- `Permissions-Policy`

## Remaining non-code requirement
- Appointment handling is simulated in-browser. For production, send form data to a backend over HTTPS and enforce server-side validation and storage controls.
