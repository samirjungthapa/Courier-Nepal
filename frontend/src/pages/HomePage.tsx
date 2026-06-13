import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { useState, useEffect } from "react";

const features = [
  {
    icon: "🚚",
    title: "We deliver within the committed timeframe safely.",
  },
  {
    icon: "🏬",
    title: "Safely delivered to homes and offices across the nation.",
  },
  {
    icon: "📍",
    title: "Real-time pickup/drop information formed at home.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create an account to start your courier journey online.",
  },
  {
    step: "02",
    title: "Enter delivery details and choose a convenient time.",
  },
  {
    step: "03",
    title: "Our agent picks up your items at your scheduled time.",
  },
  {
    step: "04",
    title: "Track well your parcel number from the app seamlessly.",
  },
];

const builtFor = [
  {
    label: "WITH A PERSONAL",
    icon: "💝",
    title: "Sending a gift or ordering merchandise, we confidently offer fast doorstep delivery solutions.",
  },
  {
    label: "INCLUSIVE",
    icon: "📦",
    title: "Small businesses who run their own ecommerce using reliable delivery solutions.",
  },
  {
    label: "OFFICES",
    icon: "🏢",
    title: "Offices that need reliable services for our delivery company within premium delivery channels.",
  },
];

const whyUs = [
  {
    icon: "🌐",
    title: "Nationwide Coverage",
    desc: "We deliver to all the remotest and urban areas with our reliable service network.",
  },
  {
    icon: "📡",
    title: "24/7 Tracking",
    desc: "Track your parcel anytime with our real-time monitoring system.",
  },
  {
    icon: "🤝",
    title: "Secure Handling",
    desc: "Your parcels are insured and handled with care by our trained team.",
  },
];

const faqs = [
  { q: "How do I book my payment?", a: "You can book payment through eSewa or Khalti via our secure checkout." },
  { q: "Do you provide doorstep pickup?", a: "Yes! We offer doorstep pickup across all major cities in Nepal." },
  { q: "How long does delivery take?", a: "Delivery typically takes 1–3 business days depending on location." },
  { q: "What payment methods do you accept?", a: "We accept eSewa, Khalti, and cash on delivery." },
];

export default function HomePage() {
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    if (token && user) {
      if (user.role === "SUPER_ADMIN") navigate("/super-admin-dashboard");
      else if (user.role === "ADMIN") navigate("/admin-dashboard");
      else if (user.role === "DELIVERY_STAFF") navigate("/delivery-staff-dashboard");
      else navigate("/dashboard");
    }
  }, [token, user, navigate]);

  return (
    <div className="home-page">
      {/* ─── Hero Section ─── */}
      <section className="hero-section">
        <div className="hero-badge">FAST &amp; RELIABLE</div>
        <h1 className="hero-title">
          Send Parcels Across Nepal,<br />
          <span className="hero-highlight">Without Leaving Home</span>
        </h1>
        <p className="hero-sub">
          Book online, schedule a doorstep pickup, and track your shipments in real-time.<br />
          Forget paper forms and long queues.
        </p>
        <div className="hero-track-form">
          <input
            className="hero-track-input"
            placeholder="Enter tracking number (eg. NP12345)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
          <Link
            to={trackingId ? `/track?id=${trackingId}` : "/track"}
            className="hero-track-btn"
          >
            Track
          </Link>
        </div>
      </section>

      {/* ─── Trusted By ─── */}
      <section className="section-padded">
        <p className="section-sub-label">Trusted by <strong>5,000+ Businesses</strong> Across Nepal</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <p className="feature-text">{f.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="section-padded section-dark">
        <h2 className="section-title">How it works</h2>
        <p className="section-desc">Send your parcel anywhere by following these steps.</p>
        <div className="how-grid">
          {howItWorks.map((s, i) => (
            <div key={i} className="how-card">
              <div className="how-step">{s.step}</div>
              <p className="how-text">{s.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Built For Everyone ─── */}
      <section className="section-padded">
        <h2 className="section-title">Built For Everyone</h2>
        <div className="built-grid">
          {builtFor.map((b, i) => (
            <div key={i} className="built-card">
              <span className="built-label">{b.label}</span>
              <div className="built-icon">{b.icon}</div>
              <p className="built-text">{b.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Why Choose Us ─── */}
      <section className="section-padded section-dark">
        <p className="feature-badge-label">Features</p>
        <h2 className="section-title">Why Choose Us?</h2>
        <div className="why-grid">
          {whyUs.map((w, i) => (
            <div key={i} className="why-card">
              <div className="why-icon">{w.icon}</div>
              <h3 className="why-title">{w.title}</h3>
              <p className="why-desc">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="section-padded faq-section">
        <div className="faq-left">
          <h2 className="faq-heading">Frequently Asked Questions</h2>
          <p className="faq-contact">Have more questions? <a href="mailto:support@couriernepal.com">Contact our support team</a></p>
        </div>
        <div className="faq-right">
          {faqs.map((f, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {f.q}
                <span className={`faq-chevron ${openFaq === i ? "open" : ""}`}>▾</span>
              </button>
              {openFaq === i && <p className="faq-answer">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to send your first parcel?</h2>
        <p className="cta-sub">Join thousands of satisfied users who trust our transparent, fast, and secure delivery network.</p>
        {token ? (
          <Link to="/create" className="cta-btn">Schedule a Pickup</Link>
        ) : (
          <Link to="/register" className="cta-btn">Create a Free Account</Link>
        )}
      </section>
    </div>
  );
}
