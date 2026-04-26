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
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms & Conditions" subtitle="The fine print, kept friendly.">
      <h2>1. Eligibility</h2><p>You must be 18 or older to use HELOLA Trips.</p>
      <h2>2. User responsibility</h2><ul><li>Respect other members</li><li>No harassment, abuse, or illegal behavior</li></ul>
      <h2>3. Group conduct</h2><ul><li>Follow group rules</li><li>No unsafe or inappropriate actions during trips</li></ul>
      <h2>4. Booking & payments</h2><ul><li>Pricing is shown clearly per person</li><li>Cancellation & refund policies apply per trip</li></ul>
      <h2>5. Liability disclaimer</h2><p>HELOLA facilitates connections — we are not responsible for personal disputes or behavior of users.</p>
      <h2>6. Account suspension</h2><ul><li>Misconduct</li><li>Fake profiles</li><li>Violations of these terms</li></ul>
      <h2>7. Content rules</h2><p>No offensive, explicit, or harmful content. Period.</p>
    </LegalPage>
  );
}

export function CommunityGuidelines() {
  return (
    <LegalPage title="Community Guidelines" subtitle="What makes HELOLA feel like home.">
      <ul>
        <li>Be respectful — always.</li>
        <li>No discrimination of any kind.</li>
        <li>No harassment.</li>
        <li>Respect personal boundaries.</li>
        <li>Keep conversations safe and inclusive.</li>
      </ul>
      <p>These rules build trust — and trust is what makes real friendships possible.</p>
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
