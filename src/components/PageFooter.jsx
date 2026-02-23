/**
 * PageFooter — minimal site-wide footer.
 */
import { Link } from 'react-router-dom';
import '../styles/PageFooter.css';

export default function PageFooter() {
    return (
        <footer className="page-footer">
            <span className="pf-tagline">Scan, solve, and learn — step by step.</span>
            <nav className="pf-legal">
                <Link to="/terms" className="pf-legal-link">Terms of Use</Link>
                <span className="pf-legal-sep">·</span>
                <Link to="/privacy" className="pf-legal-link">Privacy Policy</Link>
            </nav>
            <span className="pf-tech">Built with React &amp; Three.js</span>
        </footer>
    );
}
