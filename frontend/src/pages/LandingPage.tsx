import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Bot,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Lock,
  PackageSearch,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/blucursor-logo.png';

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type SignalCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const featureCards: FeatureCard[] = [
  {
    icon: Boxes,
    title: 'Inventory Management',
    description: 'Add, update, and organize products, categories, and suppliers with ease.',
  },
  {
    icon: ScanSearch,
    title: 'Real-time Tracking',
    description: 'Monitor stock levels and movements across operations without switching tools.',
  },
  {
    icon: BellRing,
    title: 'Low Stock Alerts',
    description: 'Get proactive alerts before inventory gaps become operational problems.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Visualize trends, stock value, and movement patterns through live charts.',
  },
  {
    icon: ClipboardList,
    title: 'Audit Logs',
    description: 'Track every action and status change with a clear, searchable history.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Secure workflows for admins and team members with the permissions they need.',
  },
];

const aiSignals: SignalCard[] = [
  {
    icon: BrainCircuit,
    title: 'Demand Forecasting',
    description: 'See likely demand swings early by learning from movement history and seasonality.',
  },
  {
    icon: Sparkles,
    title: 'Smart Reorder Suggestions',
    description: 'Recommend what to replenish next and how much to buy based on live stock posture.',
  },
  {
    icon: ShieldCheck,
    title: 'Anomaly Detection',
    description: 'Spot unusual stock-out patterns, suspicious edits, and missing movement signals fast.',
  },
  {
    icon: Bot,
    title: 'Insightful Analytics',
    description: 'Turn raw inventory events into summaries your team can act on in minutes.',
  },
];

const steps = [
  {
    title: 'Register',
    description: 'Create your admin account and set up your inventory workspace.',
  },
  {
    title: 'Add Inventory',
    description: 'Create products, categories, pricing, and stock details in one place.',
  },
  {
    title: 'Monitor & Manage',
    description: 'Track movement in real time and respond to alerts before issues grow.',
  },
  {
    title: 'Generate Reports',
    description: 'Review trends, audits, and AI-backed insights for smarter planning.',
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-navy-secondary">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? '/dashboard' : '/login';
  const primaryLabel = isAuthenticated ? 'Open Dashboard' : 'Login to Get Started';

  return (
    <div className="landing-shell min-h-screen bg-surface-muted text-navy">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#040918_0%,#071127_42%,#0a1633_100%)] text-white">
        <div className="landing-orb left-[-12rem] top-[-12rem] h-80 w-80 bg-primary/30" />
        <div className="landing-orb bottom-[-10rem] right-[-8rem] h-72 w-72 bg-secondary/20" />
        <div className="landing-grid absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-6 sm:px-8 lg:px-10 lg:pb-20">
          <header className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="BluCursor logo" className="h-12 w-12 rounded-full object-cover shadow-lg shadow-primary/20" />
              <div>
                <p className="text-xl font-semibold tracking-[0.04em] text-white">BLUCURSOR</p>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Inventory Intelligence</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
                <a href="#features" className="transition hover:text-white">Features</a>
                <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                <a href="#about" className="transition hover:text-white">About</a>
              </nav>
              <Link
                to={primaryHref}
                className="inline-flex items-center gap-3 rounded-xl bg-[linear-gradient(135deg,#4f8dff_0%,#2e6bff_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(41,103,255,0.34)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_38px_rgba(41,103,255,0.4)]"
              >
                {isAuthenticated ? 'Dashboard' : 'Login'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <div className="mt-12">
  <div className="landing-fade-up grid gap-10 lg:grid-cols-[1fr,0.9fr] lg:items-center">
    
    {/* Left column */}
    <div>
      <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-light">
        Intelligent inventory built for connected operations
      </p>
      <h1 className="mt-5 text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl">
        BluCursor
        <span className="block text-[#6e93ff]">Inventory Management</span>
        <span className="block">System</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
        Intelligent inventory management for IoT teams. Track stock, analyze movement, and make faster
        decisions with real-time visibility and AI-powered insight.
      </p>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row">
        <Link to={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(31,97,185,0.34)] transition hover:bg-primary-dark">
          {primaryLabel}
          <ArrowRight className="h-5 w-5" />
        </Link>
        <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-4 text-base font-semibold text-white/88 backdrop-blur transition hover:bg-white/10">
          Explore Features
        </a>
      </div>
    </div>

    {/* Right column — feature pills stacked */}
    <div className="hidden lg:grid grid-cols-1 gap-3">
      {[
        { icon: CheckCircle2, label: 'Real-time visibility', sub: 'Monitor stock across all operations live' },
        { icon: CheckCircle2, label: 'AI-powered insights', sub: 'Forecasting, anomaly detection, smart reorders' },
        { icon: CheckCircle2, label: 'Secure and reliable', sub: 'Role-based access with full audit trail' },
      ].map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-light" />
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="mt-0.5 text-sm text-white/60">{sub}</p>
          </div>
        </div>
      ))}
    </div>

  </div>
</div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(31,97,185,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1fr,0.95fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">About BluCursor</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-navy sm:text-5xl">Engineering smarter inventory for modern IoT teams</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-navy-secondary">
              BluCursor helps teams manage product flow with clarity. From initial catalog setup to stock movement and
              audit readiness, the platform keeps operations accurate, visible, and decision-ready.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-navy-secondary">
              The design direction follows your reference closely, but it is adapted to this product with a crisper
              dashboard story, stronger operational language, and a landing experience built to support real usage.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(64,117,255,0.14),transparent_62%)] blur-3xl" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              {[
                { icon: PackageSearch, title: 'IoT Product Catalogs' },
                { icon: ShieldCheck, title: 'End-to-end visibility' },
                { icon: Users, title: 'Role-aware workflows' },
                { icon: BrainCircuit, title: 'Automation-ready insight' },
              ].map(({ icon: Icon, title }) => (
                <div key={title} className="rounded-2xl border border-surface-border bg-white/88 p-6 shadow-[0_22px_55px_rgba(23,32,60,0.09)] backdrop-blur">
                  <Icon className="h-8 w-8 text-primary" />
                  <p className="mt-5 text-2xl font-semibold tracking-tight text-navy">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Powerful Features"
          title="Everything you need to run inventory with confidence"
          description="The platform combines operational clarity, secure workflows, and analytics that stay useful as your inventory grows."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-[1.75rem] border border-surface-border bg-white p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-elevated"
            >
              <div className="inline-flex rounded-2xl bg-primary-light p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy">{title}</h3>
              <p className="mt-3 text-base leading-7 text-navy-secondary">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#071127_0%,#0b1734_52%,#09142d_100%)] p-8 text-white shadow-[0_24px_80px_rgba(4,12,30,0.28)] sm:p-10">
          <div className="grid gap-8 xl:grid-cols-[0.86fr,1.14fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-light">AI-powered intelligence</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">Smarter insights. Better decisions.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
                Use built-in intelligence to surface demand patterns, reorder opportunities, and suspicious inventory
                movement before it turns into lost time or lost stock.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {aiSignals.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <Icon className="h-7 w-7 text-primary-light" />
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/68">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="How It Works"
          title="A simple path from setup to insight"
          description="The onboarding flow is straightforward, which makes it much easier for mentors, teammates, and future users to get value from the system quickly."
        />

        <div className="mt-12 grid gap-5 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[1.75rem] border border-surface-border bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-lg font-bold text-primary">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <p className="text-lg font-semibold text-navy">{step.title}</p>
              </div>
              <p className="mt-4 text-base leading-7 text-navy-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#081326_0%,#0d1937_60%,#0a1329_100%)] px-8 py-10 text-white shadow-[0_20px_65px_rgba(5,12,28,0.26)] sm:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Ready to streamline your inventory?</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
                Launch the admin workspace, monitor real stock movement, and bring the whole inventory picture into one place.
              </p>
            </div>
            <Link to={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f8dff_0%,#2e6bff_100%)] px-6 py-4 text-base font-semibold text-white shadow-[0_16px_36px_rgba(41,103,255,0.32)] transition hover:translate-y-[-1px]">
              {primaryLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border bg-[#071127] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr] lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="BluCursor logo" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="text-xl font-semibold">BLUCURSOR</p>
                <p className="text-sm text-white/50">Inventory Management System</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/62">
              Building a cleaner workflow for inventory operations, analytics, and audit-ready execution.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/44">Product</p>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <p>Features</p>
              <p>AI Intelligence</p>
              <p>Security</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/44">Company</p>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <p>About Us</p>
              <p>Technology</p>
              <p>Contact</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/44">Support</p>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <p>Documentation</p>
              <p>FAQ</p>
              <p>Help Center</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
