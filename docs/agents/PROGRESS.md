# Frontend Progress

Updated: 2026-06-02

## Active Branch

- Branch: `brand-model-page-jump`
- Base lineage: `refactor/frontend`
- Remote branch: `origin/brand-model-page-jump`

## Completed And Verified

### Brand-Scoped Search

- Added a reusable brand selector to the home page and search results page.
- Supports A-Z navigation and typed prefix matching.
- Search URL and API request preserve the selected brand.
- Verified with collision query `001`: unfiltered results span multiple brands;
  filtered results contain only the selected brand.
- Saved in commit `e5881e1`.

### Transaction Table Sorting

- Added auction-date and JPY transaction-price ascending/descending controls.
- Saved in commit `e5881e1`.

### Watch Detail Default View

- Changed the transaction panel default from chart to list.
- Verified in the browser: list headers render on entry and both toggle
  directions still work.
- Saved in commit `45e0d81`.

### Brand Model Manual Page Jump

- Added a compact page-number input and jump button to brand-model pagination.
- Supports Enter submission and clamps out-of-range values to a valid page.
- Verified with Omega: `3` jumps to page 3 and `9999` clamps to page `506`.
- Saved in commit `fecb820`.

## Blocked

### Brand Model Global Transaction Ordering

- Desired behavior: brand model pages default to global
  `transactions DESC, ref ASC` ordering before pagination.
- Frontend currently requests `sort_by=transactions&sort_dir=desc` and sorts
  the visible page as a lightweight fallback.
- Frontend compatibility contract and fallback are recorded on the active
  branch.
- Production `/api/brands/:slug` ignores both snake_case and camelCase sorting
  parameters.
- Evidence:
  - Rolex has `2476` models.
  - Page 1 contains a maximum of `4` transactions after local fallback sorting.
  - Page 2 already contains a model with `593` transactions.
  - Fetching all Rolex pages in the frontend took about `27.2s`, so a global
    client-side workaround is not acceptable.
- Backend dependency: locate the deployed service implementing
  `/api/brands/:slug` and apply transaction-count ordering before pagination.
- Acceptance criteria: Rolex page 1 must include the globally highest
  transaction-count models without loading all catalog pages in the browser.

## Local Development

- The user is actively browsing `http://127.0.0.1:5173`.
- Keep the Vite server running while the local browser session is in use.
