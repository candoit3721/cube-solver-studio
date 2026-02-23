/**
 * PrivacyPage — Privacy Policy
 */
import '../styles/LegalPage.css';

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-owner">
          Published by{' '}
          <a href="https://www.candoitconsulting.com" target="_blank" rel="noopener noreferrer">
            Candoit Consulting Ltd
          </a>
        </p>
        <p className="legal-updated">Last updated: February 2026</p>

        <section>
          <h2>1. Overview</h2>
          <p>
            We take your privacy seriously. This policy explains what data (if any) we collect
            when you use this site and how it is handled. The short version: we do not collect,
            store, or share any personal information.
          </p>
        </section>

        <section>
          <h2>2. Camera & Local Processing</h2>
          <p>
            The camera scanning feature uses your device's camera to detect cube colors. All
            image processing is performed <strong>locally in your browser</strong> using
            client-side JavaScript. No images, video frames, or extracted color data are ever
            sent to a server or stored outside your device. When you close or refresh the page,
            all locally processed data is discarded.
          </p>
        </section>

        <section>
          <h2>3. Data We Do Not Collect</h2>
          <ul>
            <li>No account registration or personal identifiers</li>
            <li>No camera images or video recordings</li>
            <li>No cube states or solve history</li>
            <li>No IP address logging beyond what a standard web server provides</li>
            <li>No tracking cookies or behavioral profiling</li>
          </ul>
        </section>

        <section>
          <h2>4. Third-Party Services</h2>
          <p>
            This site may be hosted on a third-party platform (e.g., a static hosting provider).
            The hosting provider may collect standard server access logs (IP address, browser
            type, pages visited) in accordance with their own privacy policy. We do not have
            access to personally identifiable information from those logs.
          </p>
        </section>

        <section>
          <h2>5. Cookies & Local Storage</h2>
          <p>
            We do not use tracking cookies or advertising cookies. We may use browser
            <code>localStorage</code> solely to persist your calibration settings or preferences
            across sessions. This data remains on your device and is never transmitted to us.
          </p>
        </section>

        <section>
          <h2>6. Children's Privacy</h2>
          <p>
            This site is suitable for general audiences and does not knowingly collect information
            from children under 13. If you believe a child has provided personal information
            through this site, please contact us so we can address it promptly.
          </p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected on
            this page with a revised "Last updated" date.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            This Privacy Policy is issued by{' '}
            <a href="https://www.candoitconsulting.com" target="_blank" rel="noopener noreferrer">
              Candoit Consulting Ltd
            </a>
            . If you have any questions or concerns, please visit our website or open an issue on
            our public repository.
          </p>
        </section>
      </div>
    </main>
  );
}
