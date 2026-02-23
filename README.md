# Cube Solver Studio

A browser-based 3×3 cube solver with camera scanning, a step-by-step learning guide, algorithm reference, and a live API explorer.

Built by [Candoit Consulting Ltd](https://www.candoitconsulting.com).

---

## Features

- **Solver** — scan your cube with a camera or paint the stickers manually, then get an optimal (Kociemba two-phase) or beginner (layer-by-layer) solution
- **Learn** — guided 7-step Layer-by-Layer method with animated 3D cubes and algorithm explanations
- **Algorithms** — complete notation guide and LBL algorithm reference
- **API Explorer** — live interactive docs for the solver API; select examples, edit the request body, and see real responses inline
- **Privacy-first** — all camera processing happens locally in the browser; no images or cube states are ever sent to a server

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v6, Three.js |
| Backend | Node.js, Express 5 |
| Solver | [cubejs](https://github.com/ldez/cubejs) (Kociemba two-phase) + custom layer-by-layer |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Build | Vite |
| Tests | Vitest, Testing Library |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### Run in development

```bash
npm run dev
```

This starts both the Vite dev server (port 5173) and the Express API server (port 3001) concurrently.

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Frontend |
| http://localhost:3001/api/docs | Swagger UI |

### Run separately

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

### Build for production

```bash
npm run build
```

Output is written to `dist/`.

---

## API

The backend exposes two endpoints (health check excluded from the UI):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/validate` | Validate a cube state |
| `POST` | `/api/solve` | Solve a cube state |

### Supported input formats

- `faceletString` — 54-character string (e.g. `UUUUUUUUURRRRRRRRRFFF...`)
- `faceMap` — object with keys `U R F D L B`, each a 9-element array
- `flatArray` — 54-element array
- `singmaster` — `U:UUUUUUUUU/R:RRRRRRRRR/...`
- `scramble` — move sequence (e.g. `R U R' U'`)

Format is auto-detected when omitted.

### Solve methods

| Method | Description |
|--------|-------------|
| `optimal` | Kociemba two-phase — shortest solution |
| `beginner` | Layer-by-layer — human-friendly steps |

Full interactive documentation available at `/api/docs` when the server is running, or via the **API Explorer** page in the app.

---

## Project Structure

```
├── src/                   # Frontend (React + Vite)
│   ├── api/               # API client + shared Swagger spec
│   ├── components/        # Shared UI components
│   ├── engine/            # Client-side cube logic
│   ├── pages/             # Route-level page components
│   ├── scanner/           # Camera colour detection
│   └── styles/            # CSS modules
├── server/                # Backend (Express)
│   ├── routes/            # API route handlers
│   ├── solvers/           # Kociemba + layered solver adapters
│   ├── parsers/           # Input format parsers
│   └── validators/        # Cube state validation pipeline
└── docs/                  # Design docs and implementation plans
```

---

## Tests

```bash
# Run all tests (frontend + backend)
npm test -- --run

# Watch mode
npm test
```

---

## License

MIT © [Candoit Consulting Ltd](https://www.candoitconsulting.com)
