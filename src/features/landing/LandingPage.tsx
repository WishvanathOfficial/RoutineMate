import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import logoIcon from '@assets/logo-icon.svg';
import { fetchTestimonialsThunk } from './landing.thunks';
import { selectTestimonials } from './landing.selectors';
import type { Testimonial } from './landing.types';
import styles from './landing.module.scss';

const FEATURES = [
  {
    icon: 'fa-solid fa-list-check',
    tint: 'brand',
    title: 'Routine Tracking',
    text: 'Create daily, weekly, or custom-frequency habits and check them off in one tap.',
  },
  {
    icon: 'fa-solid fa-fire',
    tint: 'amber',
    title: 'Streaks that motivate',
    text: 'Stay consistent with visual streak counters that keep you coming back.',
  },
  {
    icon: 'fa-solid fa-calendar-days',
    tint: 'emerald',
    title: 'Calendar View',
    text: 'See your whole month at a glance and spot patterns in your consistency.',
  },
  {
    icon: 'fa-solid fa-bell',
    tint: 'rose',
    title: 'Smart Reminders',
    text: 'Set the right time for every habit so nothing slips through the cracks.',
  },
  {
    icon: 'fa-solid fa-chart-simple',
    tint: 'brand',
    title: 'Progress Insights',
    text: 'Track your completion rate and celebrate how far you have come.',
  },
  {
    icon: 'fa-solid fa-user-gear',
    tint: 'amber',
    title: 'Made for you',
    text: 'Light/dark themes, custom icons, and settings that fit your lifestyle.',
  },
  {
    icon: 'fa-solid fa-user-group',
    tint: 'emerald',
    title: 'Friends & Challenges',
    text: 'Stay accountable with friends, shared challenges, and progress you can celebrate together.',
  },
  {
    icon: 'fa-solid fa-wand-magic-sparkles',
    tint: 'brand',
    title: 'Smarter Insights',
    text: 'Turn your consistency patterns into practical weekly suggestions and next steps.',
  },
  {
    icon: 'fa-solid fa-stopwatch',
    tint: 'amber',
    title: 'Focus Sessions',
    text: 'Build momentum with focused timer sessions connected to the routines that matter.',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Create a routine',
    text: 'Pick a habit, set how often, and choose a reminder time.',
  },
  { step: 2, title: 'Track it daily', text: 'One tap to check in from your dashboard, every day.' },
  {
    step: 3,
    title: 'See your progress',
    text: 'Watch your streaks grow and review your consistency over time.',
  },
];

const FAQS = [
  {
    question: 'Is RoutineMate free to use?',
    answer: 'Yes — the core habit tracking experience is free forever.',
  },
  {
    question: 'Can I track more than one habit?',
    answer: 'Yes, you can create and track unlimited routines/habits.',
  },
  {
    question: 'Will there be a mobile app?',
    answer:
      'RoutineMate is a responsive web app (PWA-ready) that works great on mobile browsers, with native apps planned later.',
  },
];

function initialsFor(author: string): string {
  return author
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const stars = Array.from({ length: 5 }, (_, index) => {
    if (index < fullStars) return 'fa-solid fa-star';
    if (index === fullStars && hasHalfStar) return 'fa-solid fa-star-half-stroke';
    return 'fa-regular fa-star';
  });

  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {stars.map((icon, index) => (
        <i key={index} className={icon} aria-hidden="true" />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className={styles.testimonialCard}>
      <StarRating rating={testimonial.rating} />
      <p>&ldquo;{testimonial.quote}&rdquo;</p>
      <div className={styles.testimonialAuthor}>
        <span className={`${styles.avatar} gradient-bg`}>{initialsFor(testimonial.author)}</span>
        <span>{testimonial.author}</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const dispatch = useAppDispatch();
  const testimonials = useAppSelector(selectTestimonials);
  const pageRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTestimonialsThunk());
  }, [dispatch]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const revealElements = page.querySelectorAll<HTMLElement>(`.${styles.reveal}`);
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add(styles.visible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className={styles.landingPage} ref={pageRef}>
      <div className={styles.ambientBackground} aria-hidden="true">
        <span className={`${styles.ambientOrb} ${styles.orbIndigo}`} />
        <span className={`${styles.ambientOrb} ${styles.orbMint}`} />
        <span className={`${styles.ambientOrb} ${styles.orbRose}`} />
      </div>
      {/* Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.brand}>
            <img src={logoIcon} alt="RoutineMate" />
            <span className="gradient-text">RoutineMate</span>
          </div>
          <button
            ref={menuButtonRef}
            className={styles.menuToggle}
            type="button"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-navigation"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            <i
              className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}
              aria-hidden="true"
            />
          </button>
          <div
            id="landing-navigation"
            className={`${styles.navMenu} ${isMobileMenuOpen ? styles.navMenuOpen : ''}`}
          >
            <div className={styles.mobileMenuContent}>
              <nav className={styles.navLinks} aria-label="Main navigation">
                <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#how" onClick={() => setIsMobileMenuOpen(false)}>
                  How it works
                </a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>
                  Pricing
                </a>
                <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>
                  FAQ
                </a>
              </nav>
              <div className={styles.navActions}>
                <Link
                  to="/login"
                  className={styles.loginLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className={styles.ctaButton}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`${styles.heroContent} ${styles.reveal}`}>
          <span className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden="true" />
            Habit tracking, made simple
          </span>
          <h1>
            Build better routines.{' '}
            <span className={`gradient-text ${styles.animatedGradient}`}>One day at a time.</span>
          </h1>
          <p>
            RoutineMate helps you plan, track, and stick to the habits that matter — with streaks,
            reminders, and insights that keep you motivated.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={`${styles.ctaButton} ${styles.heroCta}`}>
              Start Free <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
            <a href="#how" className={styles.secondaryButton}>
              See how it works
            </a>
          </div>
          <p className={styles.heroTrust}>
            <span>
              <i className="fa-solid fa-circle-check" aria-hidden="true" /> No credit card required
            </span>
            <span>
              <i className="fa-solid fa-circle-check" aria-hidden="true" /> Free forever plan
            </span>
          </p>
        </div>

        <div className={styles.heroShowcase}>
          <div className={`${styles.heroPreviewCard} ${styles.reveal}`}>
            <div className={styles.heroPreviewHeader}>
              <p>Today · Aug 18</p>
              <span className={styles.heroPreviewBadge}>3/5 done</span>
            </div>
            <div className={styles.heroPreviewList}>
              <div className={`${styles.heroPreviewItem} ${styles.done}`}>
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Drink 8 glasses of water</span>
              </div>
              <div className={`${styles.heroPreviewItem} ${styles.done}`}>
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                <span>Morning meditation</span>
              </div>
              <div className={styles.heroPreviewItem}>
                <i className="fa-regular fa-circle" aria-hidden="true" />
                <span>Read 20 pages</span>
              </div>
            </div>
            <div className={styles.heroPreviewFooter}>
              <span>Current streak</span>
              <strong>
                <i className="fa-solid fa-fire" aria-hidden="true" /> 12 days
              </strong>
            </div>
          </div>
          <div className={styles.heroFeatureBubbles} aria-hidden="true">
            {FEATURES.map((feature) => (
              <span className={styles.featureBubble} key={feature.title}>
                <i className={feature.icon} />
                {feature.title}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className={styles.sectionAlt} id="social-proof">
        <div className={styles.section}>
          <div className={`${styles.statRow} ${styles.reveal}`}>
            <div>
              <strong>10,000+</strong>
              <span>Habits tracked</span>
            </div>
            <div>
              <strong className={styles.ratingStat}>
                4.8 <StarRating rating={4.5} />
              </strong>
              <span>Average rating</span>
            </div>
            <div>
              <strong>92%</strong>
              <span>Stay consistent after 30 days</span>
            </div>
            <div>
              <strong className={styles.mutedStat}>Free forever</strong>
              <span>No credit card required</span>
            </div>
          </div>
          <div className={`${styles.testimonialGrid} ${styles.reveal}`}>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Problem / solution strip */}
      <section className={`${styles.problemStrip} ${styles.reveal}`}>
        <p>
          Most habits fail not from lack of motivation — but from lack of a simple system to{' '}
          <span className={styles.problemBrand}>show up daily</span> and{' '}
          <span className={styles.problemEmerald}>see progress</span>.
        </p>
      </section>

      {/* Features */}
      <section className={styles.section} id="features">
        <div className={`${styles.sectionTitle} ${styles.reveal}`}>
          <h2>Everything you need to build habits that stick</h2>
          <p>Simple daily tracking, motivating streaks, and clear insight into your progress.</p>
        </div>
        <div className={`${styles.featureGrid} ${styles.reveal}`}>
          {FEATURES.map((feature) => (
            <div className={styles.featureCard} key={feature.title}>
              <span className={`${styles.featureIcon} ${styles[feature.tint]}`}>
                <i className={feature.icon} aria-hidden="true" />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howSection} id="how">
        <div className={styles.howInner}>
          <h2 className={`${styles.howHeading} ${styles.reveal}`}>How RoutineMate works</h2>
          <div className={`${styles.howGrid} ${styles.reveal}`}>
            {HOW_IT_WORKS.map((item) => (
              <div className={styles.howStep} key={item.step}>
                <div className={`${styles.howStepNumber} gradient-bg`}>{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.section} id="pricing">
        <div className={`${styles.sectionTitle} ${styles.reveal}`}>
          <h2>Simple pricing</h2>
          <p>Start free. Upgrade later — MVP-1 ships free-tier only.</p>
        </div>
        <div className={`${styles.pricingGrid} ${styles.reveal}`}>
          <div className={`${styles.pricingCard} ${styles.highlighted}`}>
            <h3>FREE</h3>
            <p className="price">$0/mo</p>
            <ul>
              <li>
                <i className="fa-solid fa-check" aria-hidden="true" /> Unlimited routines
              </li>
              <li>
                <i className="fa-solid fa-check" aria-hidden="true" /> Streaks &amp; calendar view
              </li>
              <li>
                <i className="fa-solid fa-check" aria-hidden="true" /> Reminders
              </li>
            </ul>
            <Link to="/register" className={styles.ctaButton}>
              Get Started
            </Link>
          </div>
          <div className={`${styles.pricingCard} ${styles.proCard}`}>
            <span className={styles.proBadge}>PRO</span>
            <h3>PRO</h3>
            <p className="price">
              $6.99<span>/mo</span>
            </p>
            <ul>
              <li>
                <i className="fa-solid fa-check" aria-hidden="true" /> Unlimited challenges &amp;
                friends
              </li>
              <li>
                <i className="fa-solid fa-check" aria-hidden="true" /> AI-generated weekly insights
              </li>
              <li>
                <i className="fa-solid fa-check" aria-hidden="true" /> Calendar sync &amp; focus
                timer
              </li>
            </ul>
            <Link to="/register" className={`${styles.ctaButton} ${styles.proCta}`}>
              Start Pro Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.sectionAlt} id="faq">
        <div className={styles.section}>
          <div className={`${styles.sectionTitle} ${styles.reveal}`}>
            <h2>Frequently asked questions</h2>
          </div>
          <div className={`${styles.faqList} ${styles.reveal}`}>
            {FAQS.map((faq) => (
              <details className={styles.faqItem} key={faq.question}>
                <summary>
                  {faq.question}
                  <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${styles.ctaSection} ${styles.reveal} gradient-bg`}>
        <h2>Ready to build better habits?</h2>
        <p>Join RoutineMate today — it&apos;s free.</p>
        <Link to="/register" className={styles.ctaSectionButton}>
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`${styles.footerTop} ${styles.reveal}`}>
          <div className={styles.footerBrand}>
            <div className={styles.brand}>
              <img src={logoIcon} alt="RoutineMate" />
              <span className={styles.footerBrandName}>RoutineMate</span>
            </div>
            <p>Build better routines, daily.</p>
          </div>
          <div className={styles.footerColumns}>
            <div className={styles.footerCol}>
              <p>Product</p>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <p>Legal</p>
              <ul>
                <li>
                  {/* No standalone Privacy/Terms pages exist yet in MVP-1 — a
                      real <a> with no destination fails jsx-a11y/anchor-is-valid,
                      so this is a button styled to match the other footer links. */}
                  <button type="button" className={styles.footerLinkButton}>
                    Privacy
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLinkButton}>
                    Terms
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className={`${styles.footerBottom} ${styles.reveal}`}>
          © 2026 Wishvanath Sah. RoutineMate is licensed under GNU GPL v3.0 only.
        </p>
      </footer>
    </div>
  );
}
