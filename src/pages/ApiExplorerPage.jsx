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

const JSON_TOKEN_RE =
  /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function tokenClass(token) {
  if (token.startsWith('"')) return token.endsWith(':') ? 'json-key' : 'json-string';
  if (token === 'true' || token === 'false') return 'json-bool';
  if (token === 'null') return 'json-null';
  return 'json-number';
}

function jsonTokens(text) {
  const parts = [];
  let last = 0;
  let m;
  const re = new RegExp(JSON_TOKEN_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<span key={m.index} className={tokenClass(m[0])}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function HighlightedJson({ json }) {
  return <pre className="aep-response">{jsonTokens(json)}</pre>;
}

function JsonEditor({ value, onChange, ariaLabel }) {
  let highlight;
  try {
    JSON.parse(value);
    highlight = jsonTokens(value);
  } catch {
    highlight = value; // invalid JSON — show plain text, no coloring
  }

  return (
    <div className="aep-editor-wrap">
      <pre className="aep-editor-highlight" aria-hidden="true">{highlight}{'\n'}</pre>
      <textarea
        className="aep-editor"
        value={value}
        onChange={onChange}
        spellCheck={false}
        rows={12}
        aria-label={ariaLabel}
      />
    </div>
  );
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

      <JsonEditor
        value={body}
        onChange={(e) => setBody(e.target.value)}
        ariaLabel={`Request body for ${path}`}
      />

      <button
        className="aep-send"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? 'Sending…' : 'Send'}
      </button>

      {error && <p className="aep-error">{error}</p>}

      {response && <HighlightedJson json={response} />}
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
