// Oryn Static Content - AI Collection Agent
// This file contains all the hardcoded content for the Oryn marketing website

export const orynContent = {
  metadata: {
    title: "Oryn - AI Collection Agent",
    description: "The world's first AI Collection Agent. You're owed money. Oryn collects it.",
  },

  hero: {
    _id: "oryn-hero",
    _analyticsKey: "hero",
    customerSatisfactionBanner: {
      text: "Trusted by 500+ creators & freelancers",
      avatars: { items: [] },
    },
    title: "AI-powered payment\ncollection for creators",
    subtitle:
      "Upload your contracts, and let Oryn autonomously pursue payments through personalized reminders, escalations, and instant USDC settlement.",
    actions: [
      {
        _id: "hero-cta-1",
        href: "https://app.oryn.cc/sign-up",
        label: "Start Collecting",
        type: "primary" as const,
      },
      {
        _id: "hero-cta-2",
        href: "https://app.oryn.cc/sign-in",
        label: "Sign In",
        type: "secondary" as const,
      },
    ],
  },

  features: {
    _id: "oryn-features",
    heading: {
      badge: "Features",
      title: "Everything You Need to Get Paid",
      subtitle: "Powerful features that handle the entire collection process for you",
      align: "center" as const,
    },
    features: {
      items: [
        {
          _id: "feature-1",
          _title: "AI Contract Parsing",
          description:
            "Upload any contract format - PDFs, emails, or even screenshots. Oryn's AI extracts everything needed to start collecting.",
          icon: "document",
          bullets: [
            "Extracts payment terms and deadlines",
            "Identifies parties and contact info",
            "Calculates amounts with tax handling",
          ],
        },
        {
          _id: "feature-2",
          _title: "Multi-Channel Outreach",
          description:
            "Reach clients where they are. Oryn communicates through their preferred channels with personalized, professional messaging.",
          icon: "channels",
          bullets: [
            "Email with professional templates",
            "WhatsApp for 98% open rates",
            "SMS for urgent escalations",
          ],
        },
        {
          _id: "feature-3",
          _title: "Intelligent Follow-ups",
          description:
            "Oryn's AI knows when to be gentle and when to escalate. The tone adapts based on client behavior and payment history.",
          icon: "robot",
          bullets: [
            "Automated reminder scheduling",
            "Tone adapts to client responses",
            "Professional escalation sequences",
          ],
        },
        {
          _id: "feature-4",
          _title: "Instant USDC Settlement",
          description:
            "Get paid the moment your client pays. No more waiting 3-5 business days for bank transfers or dealing with conversion fees.",
          icon: "money",
          bullets: [
            "Instant settlement in USDC",
            "Accept cards, bank, or crypto",
            "No currency conversion delays",
          ],
        },
      ],
    },
  },

  howItWorks: {
    _id: "oryn-how-it-works",
    heading: {
      badge: "How It Works",
      title: "Get Paid in 3 Simple Steps",
      subtitle: "From unpaid invoice to USDC in your wallet — fully automated.",
      align: "center" as const,
    },
    steps: [
      {
        _id: "step-1",
        number: "01",
        title: "Upload Your Contracts",
        description:
          "Simply upload your invoices, contracts, or screenshots. Oryn's AI automatically extracts payment terms, amounts, deadlines, and client contact information.",
        icon: "upload",
      },
      {
        _id: "step-2",
        number: "02",
        title: "Oryn Takes Over",
        description:
          "Our AI agent begins personalized outreach through email, SMS, and WhatsApp. It adapts tone and timing based on client behavior to maximize collection success.",
        icon: "robot",
      },
      {
        _id: "step-3",
        number: "03",
        title: "Get Paid Instantly",
        description:
          "When your client pays, you receive instant settlement in USDC. No waiting for bank transfers, no conversion fees — just immediate access to your funds.",
        icon: "wallet",
      },
    ],
  },

  pricing: {
    _id: "oryn-pricing",
    heading: {
      title: "Simple, Success-Based Pricing",
      subtitle: "You only pay when Oryn collects. No upfront fees, no monthly subscriptions.",
      align: "center" as const,
    },
    plans: {
      items: [
        {
          plan: {
            _id: "plan-starter",
            _title: "Starter",
            price: "5%",
            billed: "of collected amount",
            isMostPopular: false,
            list: {
              items: [
                { _id: "s1", _title: "Up to $10,000/month in collections" },
                { _id: "s2", _title: "AI contract parsing" },
                { _id: "s3", _title: "Email outreach" },
                { _id: "s4", _title: "Basic dashboard" },
                { _id: "s5", _title: "USDC settlement" },
              ],
            },
          },
        },
        {
          plan: {
            _id: "plan-pro",
            _title: "Professional",
            price: "3.5%",
            billed: "of collected amount",
            isMostPopular: true,
            list: {
              items: [
                { _id: "p1", _title: "Up to $100,000/month in collections" },
                { _id: "p2", _title: "Multi-channel outreach (Email, SMS, WhatsApp)" },
                { _id: "p3", _title: "Advanced AI escalation" },
                { _id: "p4", _title: "Priority support" },
                { _id: "p5", _title: "Custom payment pages" },
                { _id: "p6", _title: "API access" },
              ],
            },
          },
        },
        {
          plan: {
            _id: "plan-enterprise",
            _title: "Enterprise",
            price: "Custom",
            billed: "volume-based pricing",
            isMostPopular: false,
            list: {
              items: [
                { _id: "e1", _title: "Unlimited collections" },
                { _id: "e2", _title: "White-label solution" },
                { _id: "e3", _title: "Dedicated account manager" },
                { _id: "e4", _title: "Custom integrations" },
                { _id: "e5", _title: "SLA guarantees" },
                { _id: "e6", _title: "On-premise deployment option" },
              ],
            },
          },
        },
      ],
    },
  },

  faq: {
    _id: "oryn-faq",
    heading: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about Oryn",
      align: "center" as const,
    },
    questions: {
      items: [
        {
          _analyticsKey: "faq-1",
          _title: "How does Oryn work?",
          answer:
            "Simply upload your contracts or invoices. Oryn's AI parses the documents, identifies payment terms and parties, then autonomously handles collection through personalized outreach across email, SMS, and WhatsApp.",
        },
        {
          _analyticsKey: "faq-2",
          _title: "What payment methods does Oryn support?",
          answer:
            "Oryn accepts payments via credit card, bank transfer, and cryptocurrency. All payments are settled to you in USDC for instant access to your funds.",
        },
        {
          _analyticsKey: "faq-3",
          _title: "Is Oryn compliant with collection regulations?",
          answer:
            "Yes. Oryn is designed to be compliant with FDCPA, TCPA, and international collection regulations. Our AI ensures all communications are professional, timely, and within legal boundaries.",
        },
        {
          _analyticsKey: "faq-4",
          _title: "How long does it take to collect?",
          answer:
            "Most collections are resolved within 14-30 days. Oryn's AI optimizes timing and messaging based on debtor behavior patterns to maximize collection speed.",
        },
        {
          _analyticsKey: "faq-5",
          _title: "Can I customize the collection messages?",
          answer:
            "Absolutely. You can set your preferred tone, add custom branding, and define escalation rules. Oryn adapts to your style while maintaining effectiveness.",
        },
        {
          _analyticsKey: "faq-6",
          _title: "What if the debtor disputes the amount?",
          answer:
            "Oryn handles disputes intelligently. It can present documentation, negotiate partial payments, or escalate to you for complex cases. You always have final control.",
        },
      ],
    },
  },

  testimonials: {
    _id: "oryn-testimonials",
    heading: {
      title: "Trusted by Creators & Freelancers",
      subtitle: "See what our users are saying",
      align: "center" as const,
    },
    testimonials: {
      items: [
        {
          _id: "testimonial-1",
          quote:
            "Oryn collected $47,000 in outstanding invoices within my first month. I was skeptical about AI handling sensitive client conversations, but the results speak for themselves.",
          author: {
            _title: "Sarah Chen",
            role: "Freelance Designer",
            avatar: null,
          },
        },
        {
          _id: "testimonial-2",
          quote:
            "As an agency owner, chasing payments was eating up 20+ hours a month. Now Oryn handles it all, and our collection rate went from 78% to 96%.",
          author: {
            _title: "Marcus Johnson",
            role: "Creative Agency Owner",
            avatar: null,
          },
        },
        {
          _id: "testimonial-3",
          quote:
            "The USDC settlement is a game-changer. No more waiting 3-5 business days for bank transfers. I get paid instantly.",
          author: {
            _title: "Alex Rivera",
            role: "Web Developer",
            avatar: null,
          },
        },
      ],
    },
  },

  callout: {
    _id: "oryn-callout",
    title: "Stop Chasing. Start Collecting.",
    subtitle:
      "Join hundreds of creators and freelancers who've recovered millions in unpaid invoices with Oryn.",
    cta: {
      _id: "callout-cta",
      href: "https://app.oryn.cc/sign-up",
      label: "Get Started Free",
      type: "primary" as const,
    },
  },

  companies: {
    _id: "oryn-companies",
    title: "Integrated With Your Favorite Tools",
    companies: {
      items: [
        { _id: "c1", _title: "Stripe", logo: null },
        { _id: "c2", _title: "QuickBooks", logo: null },
        { _id: "c3", _title: "FreshBooks", logo: null },
        { _id: "c4", _title: "Xero", logo: null },
        { _id: "c5", _title: "Wave", logo: null },
        { _id: "c6", _title: "PayPal", logo: null },
      ],
    },
  },

  supporters: {
    _id: "oryn-supporters",
    title: "Supported By",
    items: [
      { _id: "s1", _title: "Arc", logo: "/supporters/Arc.png" },
      { _id: "s2", _title: "Circle", logo: "/supporters/Circle.png" },
      { _id: "s3", _title: "Google DeepMind", logo: "/supporters/Google Deepmind.png" },
      { _id: "s4", _title: "Surge", logo: "/supporters/Surge.png" },
    ],
  },

  benefits: {
    _id: "oryn-benefits",
    heading: {
      badge: "Benefits",
      title: "Why Choose Oryn",
      subtitle:
        "Streamline your payment collection with AI-powered automation designed for creators and freelancers who value their time.",
      align: "center" as const,
    },
    items: [
      {
        _id: "benefit-1",
        icon: "clock",
        title: "Save 20+ Hours Monthly",
        description:
          "Automate repetitive follow-ups and payment reminders, freeing up your time to focus on creative work.",
      },
      {
        _id: "benefit-2",
        icon: "chart",
        title: "96% Collection Rate",
        description:
          "Our AI-powered approach achieves industry-leading collection rates through intelligent timing and messaging.",
      },
      {
        _id: "benefit-3",
        icon: "shield",
        title: "Compliance Built-In",
        description:
          "Stay compliant with FDCPA, TCPA, and international regulations without lifting a finger.",
      },
      {
        _id: "benefit-4",
        icon: "lightning",
        title: "Instant Settlements",
        description:
          "Get paid immediately in USDC when your clients pay. No more waiting for bank transfers.",
      },
      {
        _id: "benefit-5",
        icon: "users",
        title: "Preserve Relationships",
        description:
          "Professional, personalized messaging that collects payments while maintaining client goodwill.",
      },
      {
        _id: "benefit-6",
        icon: "globe",
        title: "Global Reach",
        description:
          "Collect from clients worldwide with multi-currency support and localized communication.",
      },
    ],
  },

  footer: {
    copyright: "Oryn. All rights reserved.",
    navbar: {
      items: [
        {
          _id: "nav-product",
          _title: "Product",
          href: "/#features",
          items: [],
        },
        {
          _id: "nav-pricing",
          _title: "Pricing",
          href: "/#pricing",
          items: [],
        },
      ],
    },
    socialLinks: [
      { _id: "social-twitter", _title: "Twitter", href: "https://twitter.com/hausorlabs" },
      { _id: "social-linkedin", _title: "LinkedIn", href: "https://linkedin.com/company/hausorlabs" },
    ],
    newsletter: null,
  },

  header: {
    navbar: {
      items: [
        {
          _id: "header-features",
          _title: "Features",
          href: "#features",
          items: [],
        },
        {
          _id: "header-how-it-works",
          _title: "How It Works",
          href: "#how-it-works",
          items: [],
        },
        {
          _id: "header-pricing",
          _title: "Pricing",
          href: "#pricing",
          items: [],
        },
        {
          _id: "header-faq",
          _title: "FAQ",
          href: "#faq",
          items: [],
        },
      ],
    },
    ctas: [
      {
        _id: "header-cta-login",
        href: "https://app.oryn.cc/sign-in",
        label: "Log In",
        type: "secondary" as const,
      },
      {
        _id: "header-cta-signup",
        href: "https://app.oryn.cc/sign-up",
        label: "Get Started",
        type: "primary" as const,
      },
    ],
  },
};

export type OrynContent = typeof orynContent;
