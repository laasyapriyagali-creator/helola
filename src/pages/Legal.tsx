import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReactNode, useEffect } from "react";

export function LegalPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => { document.title = `${title} · HELOLA`; }, [title]);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 md:px-8 md:pt-10">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      <div className="prose prose-sm mt-6 max-w-none text-foreground/90 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:my-1 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-12 text-center text-xs text-muted-foreground">© All rights reserved by HELOLA</p>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" subtitle="Last updated April 2026">
      <h2>1. Data we collect</h2>
      <ul>
        <li>Name, email, phone number</li>
        <li>Location data (with your permission)</li>
        <li>Profile info — bio, 2D avatar, hobbies</li>
        <li>Trip activity & preferences</li>
      </ul>
      <h2>2. How we use your data</h2>
      <ul>
        <li>To match you with trips you'll love</li>
        <li>To improve recommendations</li>
        <li>To enable communication in group chats</li>
        <li>To ensure safety and moderation</li>
      </ul>
      <h2>3. Data sharing</h2>
      <p>Your data is never sold to third parties. We share it only when necessary — with payment providers and for legal compliance.</p>
      <h2>4. Your control</h2>
      <ul><li>Edit your profile anytime</li><li>Delete your account</li><li>Control profile visibility</li></ul>
      <h2>5. Security</h2>
      <p>Your data is encrypted in transit and at rest. We monitor regularly for misuse.</p>
      <h2>6. Cookies & tracking</h2>
      <p>We use cookies to improve your experience.</p>
      <h2>7. Updates</h2>
      <p>You'll be notified of major changes to this policy.</p>

      <h2>8. Aadhaar verification & legal framework (India)</h2>
      <p>For users in India, identity verification on HELOLA may involve Aadhaar-based checks. Misuse, fraud, or forgery related to Aadhaar is governed primarily by the <strong>Aadhaar Act, 2016 (Sections 38–40)</strong> and supported by relevant provisions of the <strong>Indian Penal Code (IPC)</strong>. Users found engaging in such conduct will be reported to the appropriate authorities.</p>

      <h3>Key IPC and legal provisions for Aadhaar misuse</h3>
      <ul>
        <li><strong>Forgery & fraud</strong> — Creating fake Aadhaar cards or altering data is punishable under <strong>IPC 464</strong> (making a false document) and <strong>IPC 467 / 468</strong> (forgery of valuable security / forgery for the purpose of cheating).</li>
        <li><strong>Unauthorised use or possession</strong> — Using a forged document as genuine falls under <strong>IPC Section 471</strong>.</li>
        <li><strong>Impersonation</strong> — Pretending to be someone else using their Aadhaar details is covered under <strong>IPC Section 419</strong>.</li>
        <li><strong>Aadhaar Act offences</strong> — Unauthorised access to the Central Identities Data Repository (CIDR), or capturing biometrics without authority, can attract <strong>3–10 years imprisonment</strong> and fines under the <strong>Aadhaar Act, 2016</strong>.</li>
      </ul>
      <p className="text-xs text-muted-foreground">This section is provided for general awareness. It does not constitute legal advice. For official guidance, refer to UIDAI (uidai.gov.in) and consult a qualified legal professional.</p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms & Conditions" subtitle="HELOLA Trips">
      <p>Welcome to HELOLA Trips. By using our platform, you agree to the following terms:</p>

      <h2>1. Eligibility</h2>
      <p>You must be at least 18 years old to use HELOLA.</p>

      <h2>2. User Responsibility</h2>
      <p>You are responsible for your behavior on the platform and during trips. You agree to treat others respectfully and follow all community guidelines.</p>

      <h2>3. Trip Participation</h2>
      <p>HELOLA facilitates connections between users but does not organize or control individual behavior during trips. Users participate at their own risk.</p>

      <h2>4. Bookings & Payments</h2>
      <p>All trip costs, inclusions, and terms must be clearly understood before booking. Cancellation and refund policies will be defined per trip.</p>

      <h2>5. Safety Disclaimer</h2>
      <p>HELOLA is not responsible for personal disputes, injuries, losses, or damages that may occur during trips.</p>

      <h2>6. Account Integrity</h2>
      <p>Users must provide accurate information. Fake accounts or misuse may lead to suspension or permanent ban.</p>

      <h2>7. Content Policy</h2>
      <p>Users may not post harmful, illegal, or offensive content on the platform.</p>

      <h2>8. Account Suspension</h2>
      <p>HELOLA reserves the right to suspend or terminate accounts that violate rules or harm the community.</p>

      <h2>9. Modifications</h2>
      <p>HELOLA may update these terms at any time. Continued use means acceptance of updated terms.</p>

      <h2>10. Contact</h2>
      <p>For any concerns, users can contact support through the app.</p>
    </LegalPage>
  );
}

export function CommunityGuidelines() {
  return (
    <LegalPage title="Community Guidelines" subtitle="What makes HELOLA feel like home.">
      <h2>1. Be Respectful</h2>
      <p>Treat everyone with kindness. No hate, bullying, discrimination, or offensive language.</p>

      <h2>2. Respect Boundaries</h2>
      <p>Not everyone is comfortable with the same things. Respect personal space, opinions, and choices.</p>

      <h2>3. No Harassment or Misconduct</h2>
      <p>Any form of harassment, inappropriate behavior, or unwanted advances will not be tolerated — online or during trips.</p>

      <h2>4. Be Honest</h2>
      <p>Use real information. No fake identities, misleading profiles, or impersonation.</p>

      <h2>5. Keep It Safe</h2>
      <p>Do not encourage risky, illegal, or unsafe activities during trips.</p>

      <h2>6. No Spam or Promotions</h2>
      <p>Do not use HELOLA for advertising, selling, or promoting unrelated services.</p>

      <h2>7. Inclusive Environment</h2>
      <p>We welcome people from all backgrounds. Discrimination of any kind is not allowed.</p>

      <h2>8. Report Issues</h2>
      <p>If something feels wrong, report it. Your safety matters to us.</p>

      <p className="mt-6 text-sm text-muted-foreground">Violating these guidelines may result in warnings, suspension, or permanent removal from HELOLA.</p>
    </LegalPage>
  );
}

export function About() {
  return (
    <LegalPage title="About HELOLA Trips" subtitle="Real trips. Real friends.">
      <p>HELOLA Trips is not just about traveling — it's about meeting people, creating memories, and feeling connected in a world that often feels distant.</p>
      <p>We created HELOLA for those who want more than just booking tickets and hotels. Our platform brings together small groups of like-minded individuals to explore places, share moments, and build real friendships.</p>
      <p>Founded by <strong>Lily Portlyn</strong>, HELOLA Trips is built on the idea that travel should feel human, not transactional.</p>
      <h2>What we believe</h2>
      <ul>
        <li>Small groups beat big crowds.</li>
        <li>Phones offline, eyes up.</li>
        <li>Affordable shouldn't mean impersonal.</li>
        <li>Safety isn't a feature — it's the foundation.</li>
      </ul>
      <p className="mt-6"><Link to="/" className="text-primary underline">← Back to discover trips</Link></p>
    </LegalPage>
  );
}

export function Support() {
  return (
    <LegalPage title="Contact & Support" subtitle="We're here for you.">
      <p>We're here to help you have the best experience on HELOLA. Whether it's a trip issue or a safety concern, our support team is available to assist you.</p>
      <h2>What we can help with</h2>
      <ul><li>Booking issues</li><li>Refund requests</li><li>Safety concerns</li><li>Technical problems</li></ul>
      <h2>Reach us</h2>
      <ul>
        <li>Email: <a className="text-primary underline" href="mailto:support@helola.app">support@helola.app</a></li>
        <li>In-app help center (coming soon)</li>
        <li>Use the <strong>Report</strong> button on any trip or profile</li>
      </ul>
    </LegalPage>
  );
}
