# API Explorer Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/api-explorer` page with two side-by-side live panels for `POST /api/validate` and `POST /api/solve`, driven by the existing Swagger spec.

**Architecture:** Extract `swaggerSpec` into `src/api/apiSpec.js` (single source of truth). Server re-exports from there. `ApiExplorerPage` reads examples directly from the spec, pre-fills editable textareas, and calls existing `cubeApi.js` functions to send requests and show responses inline.

**Tech Stack:** React, React Router v6, existing `cubeApi.js` (`solveCube`, `validateCube`), Vitest + Testing Library for tests.

---

### Task 1: Extract swaggerSpec into shared src/api/apiSpec.js

**Files:**
- Create: `src/api/apiSpec.js`
- Modify: `server/swagger.js`

**Step 1: Create `src/api/apiSpec.js`**

Move the entire `swaggerSpec` export from `server/swagger.js` to `src/api/apiSpec.js` verbatim:

```js
// src/api/apiSpec.js
export const swaggerSpec = {
  // ... full existing content of server/swagger.js ...
};
```

Copy the full object from `server/swagger.js` — do not abbreviate.

**Step 2: Update `server/swagger.js` to re-export**

Replace the entire content of `server/swagger.js` with:

```js
// server/swagger.js
// Single source of truth lives in src/api/apiSpec.js
import { swaggerSpec } from '../src/api/apiSpec.js';
export { swaggerSpec };
```

**Step 3: Verify server still starts**

```bash
cd server && node --experimental-vm-modules index.js &
sleep 2 && curl -s http://localhost:3001/api/docs | grep -c 'swagger' && kill %1
```
Expected: prints a number > 0 (swagger UI HTML served).

**Step 4: Run full test suite**

```bash
npm test -- --run
```
Expected: all tests pass (no changes to logic, just moved file).

**Step 5: Commit**

```bash
git add src/api/apiSpec.js server/swagger.js
git commit -m "refactor: extract swaggerSpec to src/api/apiSpec.js for frontend sharing"
```

---

### Task 2: Add ApiExplorerPage component

**Files:**
- Create: `src/pages/ApiExplorerPage.jsx`
- Create: `src/styles/ApiExplorerPage.css`

**Step 1: Write the failing test**

Create `src/pages/__tests__/ApiExplorerPage.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ApiExplorerPage from '../ApiExplorerPage.jsx';

vi.mock('../../api/cubeApi.js', () => ({
  validateCube: vi.fn().mockResolvedValue({ valid: true, isSolved: false, facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }),
  solveCube: vi.fn().mockResolvedValue({ solved: true, moves: ["U", "R"], moveCount: 2, movesString: "U R", method: 'kociemba' }),
}));

function renderPage() {
  return render(<MemoryRouter><ApiExplorerPage /></MemoryRouter>);
}

describe('ApiExplorerPage', () => {
  it('renders both endpoint panels', () => {
    renderPage();
    expect(screen.getByText('/api/validate')).toBeInTheDocument();
    expect(screen.getByText('/api/solve')).toBeInTheDocument();
  });

  it('renders example picker pills for validate panel', () => {
    renderPage();
    // spec has 5 examples: faceletString, faceMap, flatArray, singmaster, scramble
    const pills = screen.getAllByRole('button', { name: /facelet string/i });
    expect(pills.length).toBeGreaterThanOrEqual(1);
  });

  it('pre-fills textarea with first example on load', () => {
    renderPage();
    const textareas = screen.getAllByRole('textbox');
    expect(textareas[0].value).toContain('"cube"');
  });

  it('sends validate request and shows response', async () => {
    const user = userEvent.setup();
    renderPage();
    const sendButtons = screen.getAllByRole('button', { name: /send/i });
    await user.click(sendButtons[0]);
    expect(await screen.findByText(/"valid"/)).toBeInTheDocument();
  });

  it('sends solve request and shows response', async () => {
    const user = userEvent.setup();
    renderPage();
    const sendButtons = screen.getAllByRole('button', { name: /send/i });
    await user.click(sendButtons[1]);
    expect(await screen.findByText(/"solved"/)).toBeInTheDocument();
  });

  it('shows error message on bad JSON in textarea', async () => {
    const user = userEvent.setup();
    renderPage();
    const textareas = screen.getAllByRole('textbox');
    await user.clear(textareas[0]);
    await user.type(textareas[0], 'not json');
    const sendButtons = screen.getAllByRole('button', { name: /send/i });
    await user.click(sendButtons[0]);
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --run src/pages/__tests__/ApiExplorerPage.test.jsx
```
Expected: FAIL — `ApiExplorerPage.jsx` does not exist yet.

**Step 3: Create `src/pages/ApiExplorerPage.jsx`**

```jsx
/**
 * ApiExplorerPage — live interactive API explorer for /api/validate and /api/solve.
 * Driven entirely by swaggerSpec — no hardcoded endpoint metadata.
 */
import { useState } from 'react';
import { swaggerSpec } from '../api/apiSpec.js';
import { validateCube, solveCube } from '../api/cubeApi.js';
import '../styles/ApiExplorerPage.css';

const ENDPOINTS = [
  {
    path: '/api/validate',
    specPath: '/api/validate',
    apiFn: (body) => validateCube(body.cube, { format: body.format }),
  },
  {
    path: '/api/solve',
    specPath: '/api/solve',
    apiFn: (body) => solveCube(body.cube, { format: body.format, method: body.method }),
  },
];

function getExamples(specPath) {
  const op = swaggerSpec.paths[specPath]?.post;
  const rawExamples = op?.requestBody?.content?.['application/json']?.examples ?? {};
  return Object.entries(rawExamples).map(([key, ex]) => ({
    key,
    label: ex.summary ?? key,
    value: JSON.stringify(ex.value, null, 2),
  }));
}

function getDescription(specPath) {
  return swaggerSpec.paths[specPath]?.post?.description ?? '';
}

function EndpointPanel({ path, specPath, apiFn }) {
  const examples = getExamples(specPath);
  const [selectedKey, setSelectedKey] = useState(examples[0]?.key ?? '');
  const [body, setBody] = useState(examples[0]?.value ?? '');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function selectExample(ex) {
    setSelectedKey(ex.key);
    setBody(ex.value);
    setResponse(null);
    setError(null);
  }

  async function handleSend() {
    setResponse(null);
    setError(null);

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      setError('Invalid JSON — please fix the request body before sending.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiFn(parsed);
      setResponse(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aep-panel">
      <div className="aep-panel-header">
        <span className="aep-method">POST</span>
        <span className="aep-path">{path}</span>
      </div>
      <p className="aep-description">{getDescription(specPath)}</p>

      <div className="aep-examples">
        {examples.map((ex) => (
          <button
            key={ex.key}
            className={`aep-pill ${selectedKey === ex.key ? 'aep-pill-active' : ''}`}
            onClick={() => selectExample(ex)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <textarea
        className="aep-editor"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        spellCheck={false}
        rows={12}
        aria-label={`Request body for ${path}`}
      />

      <button
        className="aep-send"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? 'Sending…' : 'Send'}
      </button>

      {error && <p className="aep-error">{error}</p>}

      {response && (
        <pre className="aep-response">{response}</pre>
      )}
    </div>
  );
}

export default function ApiExplorerPage() {
  return (
    <main className="aep-page">
      <div className="aep-header">
        <h1>API Explorer</h1>
        <p className="aep-subtitle">
          Live interactive access to the Rubik's Cube Solver API.
          Select an example, edit the request, and hit Send.
        </p>
      </div>
      <div className="aep-grid">
        {ENDPOINTS.map((ep) => (
          <EndpointPanel key={ep.path} {...ep} />
        ))}
      </div>
    </main>
  );
}
```

**Step 4: Create `src/styles/ApiExplorerPage.css`**

```css
/* ── ApiExplorerPage ── */
.aep-page {
  padding: 40px 32px 80px;
  max-width: 1200px;
  margin: 0 auto;
}

.aep-header {
  margin-bottom: 32px;
}

.aep-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
}

.aep-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}

.aep-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .aep-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Panel ── */
.aep-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.aep-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aep-method {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: #2563eb;
  color: #fff;
  padding: 2px 7px;
  border-radius: 4px;
}

.aep-path {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-family: monospace;
}

.aep-description {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.55;
  margin: 0;
}

/* ── Example pills ── */
.aep-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.aep-pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.aep-pill:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.aep-pill-active {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}

/* ── Editor ── */
.aep-editor {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}

.aep-editor:focus {
  border-color: var(--text-muted);
}

/* ── Send button ── */
.aep-send {
  align-self: flex-start;
  padding: 7px 20px;
  font-size: 13px;
  font-weight: 600;
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.aep-send:hover:not(:disabled) {
  opacity: 0.8;
}

.aep-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Response / Error ── */
.aep-response {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.aep-error {
  font-size: 13px;
  color: #e74c3c;
  margin: 0;
  padding: 10px 12px;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.25);
  border-radius: 6px;
}
```

**Step 5: Run tests**

```bash
npm test -- --run src/pages/__tests__/ApiExplorerPage.test.jsx
```
Expected: all 6 tests pass.

**Step 6: Commit**

```bash
git add src/pages/ApiExplorerPage.jsx src/styles/ApiExplorerPage.css src/pages/__tests__/ApiExplorerPage.test.jsx
git commit -m "feat: add ApiExplorerPage component with live panels for validate and solve"
```

---

### Task 3: Wire up routing and nav link

**Files:**
- Modify: `src/router.jsx`
- Modify: `src/components/NavHeader.jsx`
- Modify: `src/components/__tests__/NavHeader.test.jsx`

**Step 1: Write failing nav test**

Open `src/components/__tests__/NavHeader.test.jsx` and update the "renders all four navigation links" test to expect five links (add API Explorer):

```jsx
it('renders all five navigation links', () => {
  renderWithRouter(<NavHeader />);
  expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /solve/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /learn/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /algorithms/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /api/i })).toBeInTheDocument();
});
```

**Step 2: Run to verify it fails**

```bash
npm test -- --run src/components/__tests__/NavHeader.test.jsx
```
Expected: FAIL — no API link rendered yet.

**Step 3: Add route in `src/router.jsx`**

Add the import and route entry:

```jsx
import ApiExplorerPage from './pages/ApiExplorerPage.jsx';
// ...inside children array:
{ path: 'api-explorer', element: <ApiExplorerPage /> },
```

**Step 4: Add nav link in `src/components/NavHeader.jsx`**

Add to `NAV_LINKS`:

```js
const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/solve', label: 'Solve' },
  { to: '/learn', label: 'Learn' },
  { to: '/algorithms', label: 'Algorithms' },
  { to: '/api-explorer', label: 'API' },
];
```

**Step 5: Run tests**

```bash
npm test -- --run src/components/__tests__/NavHeader.test.jsx
```
Expected: all tests pass.

**Step 6: Run full suite**

```bash
npm test -- --run
```
Expected: all tests pass.

**Step 7: Commit**

```bash
git add src/router.jsx src/components/NavHeader.jsx src/components/__tests__/NavHeader.test.jsx
git commit -m "feat: wire /api-explorer route and add API nav link"
```

---

### Task 4: Smoke test in browser

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Verify**

- Navigate to `http://localhost:5173/api-explorer`
- Both panels are visible side by side
- Example pills are rendered for each panel
- Clicking a pill updates the textarea
- With the backend running (`cd server && node index.js`), clicking Send returns a real response in the response pane
- On a narrow window (<768px), panels stack vertically

**Step 3: Stop dev server** — `Ctrl+C`
