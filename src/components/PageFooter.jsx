/**
 * PageFooter — minimal site-wide footer.
 */
import '../styles/PageFooter.css';

export default function PageFooter() {
    return (
        <footer className="page-footer">
            <span className="pf-tagline">Scan, solve, and learn — step by step.</span>
            <span className="pf-tech">Built with React &amp; Three.js</span>
        </footer>
    );
}
