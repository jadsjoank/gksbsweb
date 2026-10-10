# GKSBS Assets Guide

## Asset inventory

All assets are stored directly in `public/` and are available from the site root:

| Asset | Dimensions | Usage |
| --- | ---: | --- |
| `hero-bg.jpg` | 2304x1536 | Home page hero background and global background fallback |
| `community.jpg` | 4355x2903 | Home page community section and news fallback |
| `logo.png` | 500x500 | Navbar, manifest, and page metadata |
| `kolekte1.png` | 1490x2064 | Weekly offering QRIS |
| `kolekte2.png` | 1490x2064 | Facilities offering QRIS |
| `digtive.jpeg` | 1600x1066 | DIGTIVE news fallback |
| `sensus.jpeg` | 900x1600 | Sensus news fallback |

These are real repository assets, not design placeholders.

## Donation QRIS

The home page displays both offering QRIS images:

- `/kolekte1.png`
- `/kolekte2.png`

The donation page uses `NEXT_PUBLIC_QRIS_IMAGE_URL` when that public URL is configured. If it is not configured, it falls back to `/kolekte1.png`, so the page does not render an empty placeholder.

## Code references

- Hero background: `/hero-bg.jpg` in `app/page.tsx` and `app/globals.css`
- Community image: `/community.jpg` in `app/page.tsx` and news fallbacks
- Site logo: `/logo.png` in `components/Navbar.tsx`, `app/layout.tsx`, and `public/manifest.json`
- Donation QRIS cards: `/kolekte1.png` and `/kolekte2.png` in `app/page.tsx`
- Donation page QRIS: `NEXT_PUBLIC_QRIS_IMAGE_URL`, falling back to `/kolekte1.png`
- News fallback images: `/digtive.jpeg` and `/sensus.jpeg`

To replace an asset, keep the same filename or update the references above, then test the public pages on desktop and mobile.
