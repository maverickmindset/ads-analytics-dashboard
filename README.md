# Bira’s Biryani · Analytics Studio

A frontend-only React + TypeScript foundation for Meta Ads analysis. The initial dataset is **synthetic demo data**; import a Meta CSV/Excel export through Data Manager to replace it. No Meta API, authentication, or backend is present.

## Development

Use Node.js 24 and npm 11. Run `npm ci`, then `npm run dev`. Run `npm run build` for strict TypeScript validation and production output; `npm test` exercises aggregation and missing-value semantics.

## Architecture

- `src/models`: normalized daily MetaAdsRow and separate BusinessOutcome types. Dates are ISO calendar dates, currency is INR, and missing numeric fields are null.
- `src/analytics`: pure aggregation, daily series, safe ratios, and shared formatting. Partial numeric coverage returns unknown rather than a partial total.
- `src/state`: Zustand dataset/filter state, with explicit demo, load, and clear actions.
- `src/data`: deterministic, labelled September 2026 demo dataset.
- `src/components`: responsive application shell, reusable KPI cards, and performance chart.
- `src/pages`: working Overview and six-step Data Manager import; other requested routes are explicit foundation placeholders.

Date filters anchor to the latest dataset date. Reach is summed daily reach, not deduplicated people. CAC means spend per attributed order; profit is contribution after ad spend and product cost, before operating costs. No previous-period comparison is fabricated.

Tailwind CSS 4 is enabled through Vite; shared visual styles live in `src/styles.css`. Recharts renders daily performance. TanStack Table renders import previews; Papa Parse and SheetJS/XLSX parse CSV and Excel exports client-side.

## Meta Ads import

Data Manager offers Upload → Detect Columns → Map Columns → Preview → Validate → Import Complete. CSV uses Papa Parse; XLS/XLSX uses SheetJS, including multi-sheet selection. All parsing, normalization and storage happen locally in the browser. No files or analytics are sent to a server.

- `src/lib/columnAliases.ts`: typed field registry and conservative mapping stages; unknown headers stay unmapped. Extend aliases here.
- `src/lib/parseValues.ts`: INR/numeric parsing and date-only parsing. Percentages are percentage points (`1.25%` → `1.25`); slash dates prefer day/month/year. Excel percentage formatting is respected.
- `src/lib/importData.ts`: header detection (first 30 rows, with manual override), workbook parsing, normalization and ERROR/WARNING/INFO validation.
- `src/components/import`: editable mappings and TanStack Table normalized preview (first 30 rows).
- `src/pages/DataManager.tsx`: six-step import controller. Errors block saving; warnings are reviewable and invalid cells become null. Missing spend/impressions warn; missing campaign names block. Mapping targets must be unique.
- `src/lib/datasetStorage.ts`: versioned browser-local persistence. Saving replaces the active dataset only after storage succeeds; browser quota failures leave the previous dataset intact. Export file size limit is 25 MB; browser storage capacity may require smaller imports. Refresh restores imported data. Clearing removes rows; loading demo replaces imported data.

The expanded MetaAdsRow retains the original KPI fields for compatibility: `amountSpent` → `spend`, `purchaseValue` → `revenue`, `purchases` → `orders`, and `dateStart` → `date`. Other imported metrics remain typed and available for later analytics. Unmapped fields normalize to null. Do not infer purchases from generic Results. Daily charts exclude undated and multi-day aggregate records, because their daily distribution is unavailable; aggregate totals still include them. Ratio KPI cards use aggregate numerators and denominators rather than averaging exported ratios. Imported CPC is available in preview; the Overview all-click CPC needs `Clicks (all)`.
