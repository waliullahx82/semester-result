# CSE 1-2 Result Explorer

An independent, mobile-first explorer for the supplied SUST CSE 1-2 course-result PDFs. It provides individual lookup, comparable semester and per-course rankings, descriptive analytics, and direct source provenance.

This is not an official SUST result publication. The EEE 0714 1212D lab sources are explicitly marked unofficial, and unresolved source conflicts are never guessed.

## Current validated dataset

- 10 source files: 9 PDFs across 42 pages and 1 DS lab CSV
- 7 official sources and 2 unofficial lab sources
- 9 courses totaling 19.5 credits
- 96 regular `202433` students in every official course
- 91 regular students covered by the lab sources
- 90 complete, conflict-free records eligible for overall ranking
- 126 DS lab results, including published total marks and source notes
- 1 reviewed conflicting grade (`2024331088`) and 1 reviewed session-label mismatch

The original planning audit undercounted continuation-page rows in both lab PDFs. The build-time parser processes every table row and establishes the corrected 91/90 totals above.

## Setup

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/build_results.py
npm.cmd install
npm.cmd run dev
```

If PowerShell script policy blocks `npm`, use `npm.cmd` explicitly as shown.

## Verification

```powershell
python -m unittest discover -s scripts -p "test_*.py"
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npx playwright install chromium
npm.cmd run test:e2e
```

## Data workflow

1. Keep the nine original PDFs at the project root and the DS lab CSV under `pdf/`.
2. Review `data/source-config.json` for expected metadata, credits, and explicitly acknowledged issues.
3. Run `python scripts/build_results.py`.
4. The parser validates every source and writes:
   - `src/data/results.generated.json` for the application
   - `data/validation-report.json` for audit review
   - unchanged source copies under `public/sources/`
5. Any unexpected source, duplicate, row-count change, grade-point mismatch, or metadata error stops generation.

## Ranking rules

- Overall SGPA uses all nine courses and unrounded weighted values.
- Only complete regular `202433` records receive an overall rank.
- Backlog and incomplete registrations remain searchable and receive per-course ranks where valid.
- Equal values share competition rank (`1, 2, 2, 4`).
- Missing results are not treated as zero, and conflicted results are excluded.

## Deployment

Deploy the repository to Vercel with the default Vite build command. `vercel.json` supplies SPA routing, security headers, and `X-Robots-Tag: noindex`. `public/robots.txt` also discourages crawler indexing.
