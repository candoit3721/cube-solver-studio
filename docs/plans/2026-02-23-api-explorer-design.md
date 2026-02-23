# API Explorer Page — Design

**Date**: 2026-02-23
**Status**: Approved

## Summary

Add a `/api-explorer` page to the React frontend that lets users interactively call the two real API endpoints (`POST /api/validate`, `POST /api/solve`). The page reads all metadata, examples, and schema descriptions from a shared `apiSpec.js` so it stays in sync with the Swagger spec automatically.

## Architecture

### Shared spec source

Move `swaggerSpec` out of `server/swagger.js` into `src/api/apiSpec.js`. The server's `swagger.js` re-exports from there. This gives the frontend access to the full spec with zero duplication and no network overhead.

```
src/api/apiSpec.js        ← single source of truth
server/swagger.js         ← re-exports from ../../src/api/apiSpec.js
src/pages/ApiExplorerPage.jsx  ← imports apiSpec.js directly
```

## Page Layout (`/api-explorer`)

Two side-by-side panels (stacked on narrow screens), one for each endpoint:

- Left: `POST /api/validate`
- Right: `POST /api/solve`

### Each panel contains

1. **Header** — `POST` method badge + path + short description (from spec)
2. **Example picker** — pill/tab row; one pill per named example from the spec (Facelet string, Face map, Flat array, Singmaster, Scramble). Clicking pre-fills the editor.
3. **Request editor** — `<textarea>` initialized with the selected example's JSON value; freely editable before sending
4. **Send button** — triggers the API call; shows a spinner while pending
5. **Response pane** — renders below the editor after a response arrives:
   - Success: syntax-highlighted JSON
   - Error: error message in red with the HTTP status

## Data Flow

1. Page mounts → reads examples from `apiSpec.js` paths → sets first example as default for each panel
2. User selects example pill → `JSON.stringify(example.value, null, 2)` written into textarea
3. User edits textarea freely
4. User clicks Send:
   - `JSON.parse(textarea)` → extract `{ cube, format, method }`
   - Call `validateCube(cube, { format })` or `solveCube(cube, { format, method })` from `cubeApi.js`
   - On success: set response state → render JSON
   - On error: set error state → render message
5. Parse errors in the textarea (invalid JSON) are caught before the network call and shown inline

## Routing

Add `/api-explorer` to `router.jsx` under the existing `Layout` wrapper (gets NavHeader + PageFooter + legal links automatically).

Add a nav link in `NavHeader` (or footer) pointing to `/api-explorer`.

## Files Affected

| File | Change |
|------|--------|
| `src/api/apiSpec.js` | New — extracted swaggerSpec |
| `server/swagger.js` | Modified — re-exports from apiSpec.js |
| `src/pages/ApiExplorerPage.jsx` | New — the interactive page |
| `src/styles/ApiExplorerPage.css` | New — panel layout and styles |
| `src/router.jsx` | Add `/api-explorer` route |
| `src/components/NavHeader.jsx` | Add nav link |

## What's Excluded

- Health check endpoint (excluded per requirements)
- Swagger UI iframe / embedded docs
- Schema visualization (just examples + live responses)
- Authentication (API has none)
