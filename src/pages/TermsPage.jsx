/**
 * TermsPage — Terms of Use
 */
import '../styles/LegalPage.css';

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-content">
        <h1>Terms of Use</h1>
        <p className="legal-updated">Last updated: February 2026</p>

        <section>
          <h2>1. Educational Purpose</h2>
          <p>
            This website is provided solely for informational and educational purposes. It is
            designed to help users learn how to solve the Rubik's Cube and understand related
            algorithms. No content on this site constitutes professional advice of any kind.
          </p>
        </section>

        <section>
          <h2>2. Trademark Notice</h2>
          <p>
            "Rubik's Cube" is a registered trademark of Spin Master Ltd. This website is an
            independent educational project and is not affiliated with, endorsed by, or sponsored
            by Spin Master Ltd. or any related entity. All trademarks, service marks, and trade
            names referenced on this site are the property of their respective owners.
          </p>
        </section>

        <section>
          <h2>3. Camera & Image Data</h2>
          <p>
            When you use the camera scanning feature, your camera feed and any captured images are
            processed <strong>entirely within your browser</strong>. No image data, video frames,
            or captured cube state is transmitted to or stored on any server. All processing
            happens locally on your device.
          </p>
        </section>

        <section>
          <h2>4. No Warranty</h2>
          <p>
            This site is provided "as is" without warranty of any kind, express or implied. We do
            not guarantee that the site will be error-free, uninterrupted, or that the solver will
            always produce a valid solution for every cube state entered.
          </p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, we shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use of, or
            inability to use, this site or its content.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            All original content on this site — including code, text, and visual design — is the
            property of the site's creators. You may not reproduce, distribute, or create
            derivative works without prior written permission.
          </p>
        </section>

        <section>
          <h2>7. Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms of Use at any time. Continued use of the
            site after changes are posted constitutes your acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            These Terms of Use are issued by{' '}
            <a href="https://www.candoitconsulting.com" target="_blank" rel="noopener noreferrer">
              Candoit Consulting Ltd
            </a>
            . If you have any questions, please visit our website or open an issue on our public
            repository.
          </p>
        </section>
      </div>
    </main>
  );
}
