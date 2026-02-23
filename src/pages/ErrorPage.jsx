/**
 * ErrorPage — React Router v6 error boundary page.
 * Renders a themed 404 or 500 page based on the route error.
 */
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import ErrorCube from '../components/ErrorCube.jsx';
import '../styles/ErrorPage.css';

const COPY = {
  404: {
    code: '404',
    headline: 'Cubie not found.',
    sub: "This page got scrambled and we can't solve it.",
    hint: "Maybe it was moved, or maybe someone just did a U R U' R' and ruined everything.",
    cta: 'Back to solved state',
    variant: 'scrambled',
  },
  500: {
    code: '500',
    headline: 'Something broke.',
    sub: "The server's center stickers are missing.",
    hint: "Our best solvers are on it. In the meantime, try refreshing — sometimes a reset is all it takes.",
    cta: 'Try again',
    variant: 'broken',
  },
};

export default function ErrorPage() {
  const error = useRouteError();

  let status = 500;
  if (isRouteErrorResponse(error)) {
    status = error.status === 404 ? 404 : 500;
  }

  const copy = COPY[status] ?? COPY[500];

  const handleRetry = () => window.location.reload();

  return (
    <div className="error-page">
      <div className="error-cube">
        <ErrorCube variant={copy.variant} size={560} />
      </div>

      <div className="error-body">
        <span className="error-code">{copy.code}</span>
        <h1 className="error-headline">{copy.headline}</h1>
        <p className="error-sub">{copy.sub}</p>
        <p className="error-hint">{copy.hint}</p>

        {status === 404 ? (
          <Link to="/" className="error-cta">{copy.cta}</Link>
        ) : (
          <button className="error-cta" onClick={handleRetry}>{copy.cta}</button>
        )}
      </div>
    </div>
  );
}
