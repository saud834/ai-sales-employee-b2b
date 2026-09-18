import { nanoid } from "nanoid";
import type {
  AssetSpec,
  NavLink,
  PageSpec,
  SectionSpec,
  ThemeSpec,
  WebsiteMeta,
  WebsiteSpec,
} from "@/lib/types";
import type { AIProvider, LeadContext, ModifyResult, WebsiteBrief } from "@/lib/ai/provider";
import { section, navbarSection, footerSection } from "@/lib/ai/content-templates";
import { websiteSpecSchema } from "@/lib/schema";

const WEBSITE_TYPE_KEYWORDS: Record<string, string[]> = {
  restaurant: ["restaurant", "cafe", "café", "menu", "dining", "chef", "cuisine", "مطعم", "kitchen", "grill", "bakery"],
  saas: ["saas", "software", "app platform", "dashboard product", "subscription product", "b2b software"],
  ecommerce: ["store", "shop", "ecommerce", "e-commerce", "products for sale", "sell online", "storefront"],
  portfolio: ["portfolio", "my work", "photographer", "designer portfolio", "showcase my"],
  agency: ["agency", "marketing agency", "creative studio", "clients", "our services agency"],
  event: ["event", "conference", "wedding", "summit", "festival", "ceremony"],
  blog: ["blog", "articles", "publication", "newsletter site"],
  product: ["product launch", "gadget", "device", "product page"],
  personal: ["personal website", "my resume", "cv site", "about me site"],
  business: ["business", "company", "firm", "services", "consulting", "clinic", "salon", "gym"],
  landing: ["landing page", "waitlist", "coming soon", "sign up page"],
};

function detectWebsiteType(text: string): string {
  const lower = text.toLowerCase();
  let best = "business";
  let bestScore = 0;
  for (const [type, keywords] of Object.entries(WEBSITE_TYPE_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => (lower.includes(kw) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

function containsArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

const PERSONALITY_KEYWORDS: Record<string, string[]> = {
  luxurious: ["luxury", "luxurious", "premium", "elegant", "upscale", "high-end", "فاخر"],
  modern: ["modern", "sleek", "minimal", "clean"],
  playful: ["playful", "fun", "colorful", "vibrant", "bold"],
  professional: ["professional", "corporate", "trusted", "reliable"],
  warm: ["warm", "cozy", "friendly", "welcoming", "family"],
  bold: ["bold", "dramatic", "striking"],
};

function detectPersonality(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [trait, keywords] of Object.entries(PERSONALITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) found.push(trait);
  }
  return found.length > 0 ? found : ["modern", "professional"];
}

function buildTheme(personality: string[], text: string): ThemeSpec {
  const lower = text.toLowerCase();
  const wantsDark =
    lower.includes("dark") || lower.includes("black") || personality.includes("luxurious");

  if (personality.includes("luxurious")) {
    return {
      mode: wantsDark ? "dark" : "light",
      primaryColor: wantsDark ? "#111111" : "#1a1a1a",
      secondaryColor: "#2b2b2b",
      accentColor: "#c9a227",
      surfaceColor: wantsDark ? "#0b0b0c" : "#faf8f3",
      inkColor: wantsDark ? "#f5f0e6" : "#1a1a1a",
      fontHeading: "Playfair Display",
      fontBody: "Inter",
      radius: "sm",
      density: "spacious",
    };
  }
  if (personality.includes("playful")) {
    return {
      mode: "light",
      primaryColor: "#ff5a3c",
      secondaryColor: "#ffd166",
      accentColor: "#06d6a0",
      surfaceColor: "#ffffff",
      inkColor: "#1c1c28",
      fontHeading: "Poppins",
      fontBody: "Inter",
      radius: "xl",
      density: "comfortable",
    };
  }
  if (personality.includes("warm")) {
    return {
      mode: "light",
      primaryColor: "#b3541e",
      secondaryColor: "#e8c07d",
      accentColor: "#6b8f71",
      surfaceColor: "#fbf6ee",
      inkColor: "#2a1f14",
      fontHeading: "Fraunces",
      fontBody: "Inter",
      radius: "lg",
      density: "comfortable",
    };
  }
  return {
    mode: wantsDark ? "dark" : "light",
    primaryColor: wantsDark ? "#3b82f6" : "#2563eb",
    secondaryColor: "#0ea5e9",
    accentColor: "#22c55e",
    surfaceColor: wantsDark ? "#0f172a" : "#ffffff",
    inkColor: wantsDark ? "#e2e8f0" : "#0f172a",
    fontHeading: "Inter",
    fontBody: "Inter",
    radius: "md",
    density: "comfortable",
  };
}

function extractSiteName(prompt: string, lead?: LeadContext): string {
  if (lead?.name) return lead.name;
  const forMatch = prompt.match(/for\s+([A-Z][\w'&\s-]{2,40}?)(?:[,.]|\s+in\s|\s+that\s|\s+which\s|$)/);
  if (forMatch) return forMatch[1].trim();
  return "Your Brand";
}

function extractCity(prompt: string, lead?: LeadContext): string | null {
  if (lead?.city) return lead.city;
  const cities = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina", "Al-Balad", "Abha", "Taif"];
  for (const city of cities) {
    if (prompt.includes(city)) return city;
  }
  return null;
}

interface BuildContext {
  meta: WebsiteMeta;
  city: string | null;
  lead?: LeadContext;
}

type Cuisine = "seafood" | "grill";
type Lang = "en" | "ar";

function detectCuisine(text: string): Cuisine {
  const lower = text.toLowerCase();
  const seafoodKeywords = ["seafood", "fish restaurant", "fish", "shrimp", "سمك", "بحري", "أسماك", "روبيان", "مأكولات بحرية"];
  return seafoodKeywords.some((kw) => lower.includes(kw)) ? "seafood" : "grill";
}

function detectBilingual(text: string): boolean {
  const lower = text.toLowerCase();
  const mentionsEnglish = lower.includes("english") || lower.includes("انجليز") || lower.includes("إنجليز") || lower.includes("انكليز");
  const mentionsArabic = lower.includes("arabic") || lower.includes("عربي");
  const explicit = /bilingual|both languages|two languages|ar\s*\/\s*en|ar\s*&\s*en/.test(lower);
  return explicit || (mentionsEnglish && mentionsArabic);
}

function restaurantCopy(lang: Lang, cuisine: Cuisine, ctx: BuildContext) {
  const { meta, city } = ctx;
  const cityName = city ?? (lang === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia");
  const isAr = lang === "ar";

  const menu =
    cuisine === "seafood"
      ? isAr
        ? [
            {
              name: "المشويات البحرية",
              items: [
                { name: "هامور مشوي", description: "هامور طازج مشوي على الفحم، يقدم مع الأرز والصلصة", price: "ريال 95" },
                { name: "روبيان مشوي", description: "روبيان طازج متبل ومشوي، يقدم مع الأرز الأصفر", price: "ريال 75" },
                { name: "سمك دنيس مشوي", description: "دنيس كامل مشوي بالأعشاب والليمون", price: "ريال 70" },
              ],
            },
            {
              name: "المقلية",
              items: [
                { name: "روبيان مقلي", description: "روبيان مقرمش مقلي، يقدم مع صلصة الثوم", price: "ريال 70" },
                { name: "كنعد مقلي", description: "شرائح كنعد طازجة مقلية بالطريقة التقليدية", price: "ريال 60" },
              ],
            },
            {
              name: "أطباق جانبية",
              items: [
                { name: "أرز صيادية", description: "أرز أصفر منكه بمرقة السمك والبهارات", price: "ريال 15" },
                { name: "سلطة طحينة", description: "سلطة طحينة طازجة مع الليمون", price: "ريال 12" },
              ],
            },
          ]
        : [
            {
              name: "Grilled Seafood",
              items: [
                { name: "Grilled Hamour", description: "Fresh grouper grilled over charcoal, served with rice and sauce", price: "SAR 95" },
                { name: "Grilled Shrimp", description: "Marinated shrimp grilled and served with saffron rice", price: "SAR 75" },
                { name: "Whole Grilled Denis", description: "Whole sea bream grilled with herbs and lemon", price: "SAR 70" },
              ],
            },
            {
              name: "Fried Favorites",
              items: [
                { name: "Fried Shrimp", description: "Crispy fried shrimp served with garlic sauce", price: "SAR 70" },
                { name: "Fried Kingfish", description: "Fresh kingfish fillets, fried the traditional way", price: "SAR 60" },
              ],
            },
            {
              name: "Sides",
              items: [
                { name: "Sayadeya Rice", description: "Yellow rice simmered in fish stock and spices", price: "SAR 15" },
                { name: "Tahini Salad", description: "Fresh tahini salad with lemon", price: "SAR 12" },
              ],
            },
          ]
      : isAr
        ? [
            {
              name: "مشاوي",
              items: [
                { name: "مشاوي مشكل", description: "لحم ضأن، كباب، وشيش طاووق مع خضار مشوية", price: "ريال 85" },
                { name: "كبسة لحم", description: "لحم ضأن مطهو ببطء فوق أرز متبل ومكسرات محمصة", price: "ريال 65" },
              ],
            },
          ]
        : [
            {
              name: "Grills & Mashaweer",
              items: [
                { name: "Mixed Grill Platter", description: "Lamb chops, kabab, and shish tawook with grilled vegetables", price: "SAR 85" },
                { name: "Lamb Kabsa", description: "Slow-cooked lamb over spiced rice with roasted nuts", price: "SAR 65" },
              ],
            },
          ];

  const dishWord = cuisine === "seafood" ? (isAr ? "أطباق بحرية" : "seafood dishes") : isAr ? "أطباق مشاوي" : "grilled dishes";

  return {
    navLabels: isAr
      ? { home: "الرئيسية", menu: "المنيو", gallery: "المعرض", reviews: "آراء الزبائن", location: "الموقع" }
      : { home: "Home", menu: "Menu", gallery: "Gallery", reviews: "Reviews", location: "Location" },
    navbarStrings: isAr ? { whatsappCta: "تواصل واتساب", contactCta: "تواصل معنا" } : { whatsappCta: "WhatsApp Us", contactCta: "Contact" },
    footerStrings: isAr ? { contactTitle: "تواصل", rightsReserved: "جميع الحقوق محفوظة" } : { contactTitle: "Contact", rightsReserved: "All rights reserved." },
    heroEyebrow: city ? `${meta.industry} · ${cityName}` : meta.industry,
    heroSub: meta.tagline,
    primaryCta: isAr ? "احجز طاولة" : "Reserve a Table",
    secondaryCta: isAr ? "شاهد المنيو" : "View Menu",
    aboutHeading: isAr ? `عن ${meta.siteName}` : `About ${meta.siteName}`,
    aboutBody: isAr
      ? `${meta.siteName} يقدم ${dishWord} طازجة يوميًا في ${cityName}، بجودة عالية وضيافة أصيلة تعكس التراث السعودي.`
      : `${meta.siteName} brings fresh ${dishWord} to ${cityName} every day, prepared with care and served with genuine Saudi hospitality.`,
    aboutStats: isAr
      ? [
          { value: "10+", label: "أطباق مميزة" },
          { value: "4.5★", label: "تقييم الزبائن" },
          { value: "يوميًا", label: "مكونات طازجة" },
        ]
      : [
          { value: "10+", label: "Signature Dishes" },
          { value: "4.5★", label: "Guest Rating" },
          { value: "Daily", label: "Fresh Ingredients" },
        ],
    menuHeading: isAr ? "منيو المطعم" : "Our Menu",
    menuSub: isAr ? "نكهة طازجة تقدم بعناية" : "Fresh flavor, plated with care",
    menu,
    galleryHeading: isAr ? "لمحة من الداخل" : "A Glimpse Inside",
    galleryAlts: isAr
      ? ["طبق بحري مميز", "صالة الجلوس", "المشويات الطازجة", "الشيف يحضّر الطلب"]
      : ["Signature seafood platter", "Dining area", "Fresh grilled dishes", "Chef preparing an order"],
    reviewsHeading: isAr ? "آراء زبائننا" : "What Our Guests Say",
    reviews: isAr
      ? [
          { name: "فيصل أ.", role: "زبون محلي", quote: "أفضل أسماك جربتها بالرياض، طازجة ومطبوخة بإتقان.", rating: 5 },
          { name: "نورة س.", role: "زبونة دائمة", quote: "نطلب كل أسبوع، الجودة ثابتة والخدمة ممتازة.", rating: 5 },
          { name: "تركي م.", role: "تقييم جوجل", quote: "أجواء عائلية رائعة والموظفون متعاونون.", rating: 4 },
        ]
      : [
          { name: "Faisal A.", role: "Local Guest", quote: "The freshest seafood I've had in Riyadh, cooked to perfection.", rating: 5 },
          { name: "Noura S.", role: "Regular Customer", quote: "We order every week — consistent quality and great service.", rating: 5 },
          { name: "Turki M.", role: "Google Reviewer", quote: "Great family atmosphere and helpful staff.", rating: 4 },
        ],
    visitHeading: isAr ? "زورونا" : "Visit Us",
    hours: isAr
      ? [{ day: "يوميًا", hours: "12:30 ظهرًا – 11:00 مساءً" }]
      : [{ day: "Every day", hours: "12:30 PM – 11:00 PM" }],
    reservationHeading: isAr ? "احجز طاولتك" : "Reserve Your Table",
    reservationDesc: isAr
      ? "أرسل لنا التاريخ والوقت وعدد الأشخاص عبر واتساب وسنؤكد الحجز فورًا."
      : "Send us your preferred date, time, and party size on WhatsApp and we'll confirm right away.",
    contactHeading: isAr ? "تواصل معنا" : "Get in Touch",
    contactDesc: isAr
      ? "لأسئلة الطلبات الكبيرة أو المناسبات الخاصة، يسعدنا تواصلكم."
      : "Questions about catering, private events, or large groups? We're happy to help.",
  };
}

function buildRestaurantPage(
  lang: Lang,
  cuisine: Cuisine,
  ctx: BuildContext,
  languageSwitch?: { label: string; href: string }
): PageSpec {
  const { meta, city } = ctx;
  const c = restaurantCopy(lang, cuisine, ctx);
  const nav: NavLink[] = [
    { label: c.navLabels.home, href: "#home" },
    { label: c.navLabels.menu, href: "#menu" },
    { label: c.navLabels.gallery, href: "#gallery" },
    { label: c.navLabels.reviews, href: "#reviews" },
    { label: c.navLabels.location, href: "#location" },
    ...(languageSwitch ? [languageSwitch] : []),
  ];

  const sections: SectionSpec[] = [
    navbarSection(meta, nav, c.navbarStrings),
    section("hero", {
      eyebrow: c.heroEyebrow,
      headline: meta.siteName,
      subheadline: c.heroSub,
      primaryCta: { label: c.primaryCta, href: "#reservation", style: "primary" },
      secondaryCta: { label: c.secondaryCta, href: "#menu", style: "secondary" },
      alignment: "center",
    }),
    section("about", {
      heading: c.aboutHeading,
      body: c.aboutBody,
      stats: c.aboutStats,
    }),
    section("menu", {
      heading: c.menuHeading,
      subheading: c.menuSub,
      categories: c.menu,
    }),
    section("gallery", {
      heading: c.galleryHeading,
      images: c.galleryAlts.map((alt) => ({ url: "", alt })),
    }),
    section("testimonials", {
      heading: c.reviewsHeading,
      items: c.reviews,
    }),
    section("locationHours", {
      heading: c.visitHeading,
      address: meta.address ?? `${city ?? "Riyadh"}, Saudi Arabia`,
      hours: c.hours,
    }),
    section("reservation", {
      heading: c.reservationHeading,
      description: c.reservationDesc,
      whatsapp: meta.whatsapp,
      phone: meta.phone,
    }),
    section("contact", {
      heading: c.contactHeading,
      description: c.contactDesc,
      phone: meta.phone,
      whatsapp: meta.whatsapp,
      address: meta.address ?? undefined,
      showForm: true,
    }),
    footerSection(meta, nav, c.footerStrings),
  ];

  const slug = lang === "ar" ? "ar" : "home";
  return {
    id: nanoid(8),
    slug,
    name: lang === "ar" ? "العربية" : "Home",
    language: lang,
    direction: lang === "ar" ? "rtl" : "ltr",
    seo: {
      title: `${meta.siteName} | ${meta.industry} ${lang === "ar" ? "في" : "in"} ${city ?? "Saudi Arabia"}`,
      description: c.heroSub.slice(0, 195),
      keywords: [meta.industry, city ?? "Saudi Arabia", cuisine === "seafood" ? "seafood" : "restaurant"],
    },
    sections,
  };
}

function restaurantPages(ctx: BuildContext, cuisine: Cuisine, bilingual: boolean): PageSpec[] {
  if (!bilingual) {
    return [buildRestaurantPage("en", cuisine, ctx)];
  }
  const enPage = buildRestaurantPage("en", cuisine, ctx, { label: "العربية", href: "/ar" });
  const arPage = buildRestaurantPage("ar", cuisine, ctx, { label: "English", href: "/" });
  return [enPage, arPage];
}

function genericPages(ctx: BuildContext, type: string): PageSpec[] {
  const { meta, city } = ctx;
  const nav: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const heroSection = section("hero", {
    eyebrow: meta.industry,
    headline: meta.tagline,
    subheadline: `${meta.siteName} helps ${meta.targetAudience} achieve real results, backed by a team that cares about the outcome.`,
    primaryCta: { label: "Get Started", href: "#contact", style: "primary" },
    secondaryCta: { label: "Learn More", href: "#features", style: "secondary" },
    alignment: type === "saas" || type === "landing" ? "center" : "left",
  });

  const featureItems = [
    { title: "Built for Speed", description: "Everything is optimized so your team moves faster from day one." },
    { title: "Designed to Scale", description: "Grows with you, from your first customer to your thousandth." },
    { title: "Real Support", description: "A real team behind the product, not just a support ticket queue." },
  ];

  const homeSections: SectionSpec[] = [navbarSection(meta, nav), heroSection];

  if (type === "saas" || type === "landing" || type === "product") {
    homeSections.push(
      section("logoCloud", {
        heading: "Trusted by teams like yours",
        logos: [{ name: "Acme" }, { name: "Globex" }, { name: "Umbrella" }, { name: "Initech" }],
      }),
      section("features", { heading: "Why teams choose us", items: featureItems }),
      section("stats", {
        items: [
          { value: "2,400+", label: "Active Users" },
          { value: "99.9%", label: "Uptime" },
          { value: "4.8/5", label: "Average Rating" },
        ],
      }),
      section("pricing", {
        heading: "Simple, transparent pricing",
        plans: [
          { name: "Starter", price: "$0", period: "/mo", features: ["Core features", "1 project", "Community support"] },
          { name: "Pro", price: "$29", period: "/mo", features: ["Everything in Starter", "Unlimited projects", "Priority support"], highlighted: true },
          { name: "Enterprise", price: "Custom", features: ["Everything in Pro", "SSO & audit logs", "Dedicated manager"] },
        ],
      }),
      section("testimonials", {
        heading: "Loved by customers",
        items: [
          { name: "Sara K.", role: "Operations Lead", quote: "We replaced three tools with this one. Onboarding took an afternoon." },
          { name: "James O.", role: "Founder", quote: "Support actually answers, and the product just works." },
        ],
      }),
      section("faq", {
        heading: "Frequently asked questions",
        items: [
          { question: "Can I cancel anytime?", answer: "Yes, plans are month-to-month with no long-term contract." },
          { question: "Do you offer a free trial?", answer: "Yes, every plan starts with a 14-day free trial." },
        ],
      }),
      section("cta", {
        heading: "Ready to get started?",
        subheading: "Join teams already using " + meta.siteName + ".",
        primaryCta: { label: "Start Free", href: "#contact", style: "primary" },
      })
    );
  } else if (type === "portfolio" || type === "personal") {
    homeSections.push(
      section("about", {
        heading: `About ${meta.siteName}`,
        body: `${meta.siteName} is a ${meta.industry} based ${city ? `in ${city}` : ""} focused on ${meta.targetAudience}.`,
      }),
      section("gallery", {
        heading: "Selected Work",
        images: [
          { url: "", alt: "Project one" },
          { url: "", alt: "Project two" },
          { url: "", alt: "Project three" },
        ],
      }),
      section("testimonials", {
        heading: "Kind words",
        items: [{ name: "Client A.", quote: "A pleasure to work with — fast, thoughtful, and detail-oriented." }],
      }),
      section("contact", { heading: "Let's work together", showForm: true })
    );
  } else if (type === "ecommerce") {
    homeSections.push(
      section("productGrid", {
        heading: "Featured Products",
        items: [
          { name: "Product One", price: "SAR 120", description: "Best seller" },
          { name: "Product Two", price: "SAR 95" },
          { name: "Product Three", price: "SAR 150" },
        ],
      }),
      section("features", { heading: "Why shop with us", items: featureItems }),
      section("testimonials", {
        heading: "Customer reviews",
        items: [{ name: "Layla H.", quote: "Fast shipping and great quality. Will order again." }],
      }),
      section("newsletter", { heading: "Get 10% off your first order", subheading: "Join our mailing list" })
    );
  } else if (type === "agency") {
    homeSections.push(
      section("logoCloud", { heading: "Clients we've helped grow", logos: [{ name: "Acme" }, { name: "Globex" }, { name: "Initech" }] }),
      section("features", { heading: "What we do", items: featureItems }),
      section("team", {
        heading: "Meet the team",
        members: [
          { name: "Aisha Al-Rashid", role: "Creative Director" },
          { name: "Omar Hassan", role: "Head of Strategy" },
        ],
      }),
      section("pricing", {
        heading: "Engagement options",
        plans: [
          { name: "Project", price: "Custom", features: ["Scoped deliverable", "Fixed timeline"] },
          { name: "Retainer", price: "From SAR 8,000", period: "/mo", features: ["Ongoing support", "Priority turnaround"], highlighted: true },
        ],
      }),
      section("cta", { heading: "Let's build something great", primaryCta: { label: "Book a Call", href: "#contact" } })
    );
  } else if (type === "event") {
    homeSections.push(
      section("about", { heading: "About the Event", body: meta.tagline }),
      section("timeline", {
        heading: "Schedule",
        items: [
          { date: "9:00 AM", title: "Doors Open" },
          { date: "10:00 AM", title: "Opening Keynote" },
          { date: "1:00 PM", title: "Lunch & Networking" },
        ],
      }),
      section("team", { heading: "Speakers", members: [{ name: "Dr. Layla Faisal", role: "Keynote Speaker" }] }),
      section("pricing", {
        heading: "Tickets",
        plans: [
          { name: "General", price: "SAR 150", features: ["Full-day access"] },
          { name: "VIP", price: "SAR 450", features: ["Front row", "Meet & greet"], highlighted: true },
        ],
      }),
      section("faq", { heading: "FAQ", items: [{ question: "Is parking available?", answer: "Yes, free parking is available on-site." }] })
    );
  } else if (type === "blog") {
    homeSections.push(
      section("blogGrid", {
        heading: "Latest Articles",
        posts: [
          { title: "Getting Started", excerpt: "Everything you need to know to begin.", date: "This week" },
          { title: "Five Tips for Success", excerpt: "Practical advice from the field.", date: "Last week" },
        ],
      }),
      section("newsletter", { heading: "Never miss a post", subheading: "Subscribe to the newsletter" })
    );
  } else {
    homeSections.push(
      section("features", { heading: "What we offer", items: featureItems }),
      section("stats", {
        items: [
          { value: "12+", label: "Years of Experience" },
          { value: "500+", label: "Clients Served" },
        ],
      }),
      section("testimonials", {
        heading: "What clients say",
        items: [{ name: "Khalid R.", quote: "Professional, responsive, and genuinely good at what they do." }],
      }),
      section("cta", { heading: "Ready to work with us?", primaryCta: { label: "Contact Us", href: "#contact" } })
    );
  }

  homeSections.push(footerSection(meta, nav));

  const homePage: PageSpec = {
    id: nanoid(8),
    slug: "home",
    name: "Home",
    seo: {
      title: `${meta.siteName} | ${meta.tagline}`.slice(0, 68),
      description: meta.tagline.slice(0, 195),
      keywords: [meta.industry, type, meta.siteName],
    },
    sections: homeSections,
  };

  const aboutPage: PageSpec = {
    id: nanoid(8),
    slug: "about",
    name: "About",
    seo: {
      title: `About | ${meta.siteName}`,
      description: `Learn about ${meta.siteName} and our mission.`,
      keywords: ["about", meta.siteName],
    },
    sections: [
      navbarSection(meta, nav),
      section("about", {
        heading: `About ${meta.siteName}`,
        body: `${meta.siteName} exists to serve ${meta.targetAudience}. ${meta.tagline}`,
      }),
      section("stats", {
        items: [
          { value: "2015", label: "Founded" },
          { value: "50+", label: "Team Members" },
        ],
      }),
      footerSection(meta, nav),
    ],
  };

  const contactPage: PageSpec = {
    id: nanoid(8),
    slug: "contact",
    name: "Contact",
    seo: {
      title: `Contact | ${meta.siteName}`,
      description: `Get in touch with ${meta.siteName}.`,
      keywords: ["contact", meta.siteName],
    },
    sections: [
      navbarSection(meta, nav),
      section("contact", {
        heading: "Contact Us",
        description: "We would love to hear from you.",
        phone: meta.phone,
        email: meta.email,
        whatsapp: meta.whatsapp,
        address: meta.address,
        showForm: true,
      }),
      footerSection(meta, nav),
    ],
  };

  return [homePage, aboutPage, contactPage];
}

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async planWebsite(brief: WebsiteBrief): Promise<WebsiteSpec> {
    const { prompt, lead } = brief;
    const type = detectWebsiteType(prompt);
    const personality = detectPersonality(prompt);
    const bilingual = type === "restaurant" && detectBilingual(prompt);
    const cuisine = detectCuisine(prompt);
    const language = bilingual ? "en" : containsArabic(prompt) ? "ar" : "en";
    const city = extractCity(prompt, lead);
    const siteName = extractSiteName(prompt, lead);

    const meta: WebsiteMeta = {
      siteName,
      tagline:
        type === "restaurant"
          ? `Authentic ${lead?.category ?? (cuisine === "seafood" ? "seafood" : "Saudi")} cuisine, served with hospitality${city ? ` in ${city}` : ""}.`
          : `${personality[0] ?? "Modern"} ${type} built for ${lead?.category ?? "your"} audience.`,
      websiteType: type,
      industry: lead?.category ?? type,
      targetAudience:
        type === "restaurant" ? "diners looking for an authentic local experience" : "your ideal customers",
      brandPersonality: personality,
      ctaStrategy:
        type === "restaurant" ? "Drive WhatsApp reservations and phone calls" : "Drive sign-ups and contact form submissions",
      language,
      direction: language === "ar" ? "rtl" : "ltr",
      whatsapp: lead?.whatsapp,
      phone: lead?.phone,
      address: lead?.address ?? (city ? `${city}, Saudi Arabia` : undefined),
    };

    const theme = buildTheme(personality, prompt);
    if (type === "restaurant" && cuisine === "seafood" && !personality.includes("luxurious")) {
      theme.mode = "light";
      theme.primaryColor = "#0e7490";
      theme.secondaryColor = "#0891b2";
      theme.accentColor = "#d97706";
      theme.surfaceColor = "#f8fafc";
      theme.inkColor = "#0f172a";
      theme.fontHeading = "Poppins";
    }
    if (bilingual) {
      theme.fontHeading = "Tajawal";
      theme.fontBody = "Tajawal";
    }

    const ctx: BuildContext = { meta, city, lead };
    const pages = type === "restaurant" ? restaurantPages(ctx, cuisine, bilingual) : genericPages(ctx, type);
    const nav = pages[0].sections.find((s) => s.type === "navbar")?.props.links as NavLink[] | undefined;

    const assets: AssetSpec[] = [];

    const spec: WebsiteSpec = {
      meta,
      theme,
      nav: nav ?? [],
      pages,
      assets,
    };

    const result = websiteSpecSchema.safeParse(spec);
    if (!result.success) {
      throw new Error(
        "MockProvider produced an invalid spec: " + result.error.issues.map((i) => i.message).join("; ")
      );
    }
    return result.data as WebsiteSpec;
  }

  async modifyWebsite(spec: WebsiteSpec, instruction: string): Promise<ModifyResult> {
    const lower = instruction.toLowerCase();
    const next: WebsiteSpec = JSON.parse(JSON.stringify(spec));
    const notes: string[] = [];

    const hexMatch = instruction.match(/#[0-9a-fA-F]{3,6}\b/);

    if (lower.includes("sticky") && lower.includes("nav")) {
      for (const page of next.pages) {
        for (const s of page.sections) {
          if (s.type === "navbar") s.props.sticky = true;
        }
      }
      notes.push("made the navbar sticky on every page");
    }

    if (hexMatch) {
      next.theme.primaryColor = hexMatch[0];
      notes.push(`set the primary color to ${hexMatch[0]}`);
    } else if (lower.includes("primary color") && lower.includes("black")) {
      next.theme.primaryColor = "#111111";
      notes.push("set the primary color to black");
    }

    if (lower.includes("luxur") || (lower.includes("premium") && lower.includes("feel"))) {
      next.theme.mode = "dark";
      next.theme.fontHeading = "Playfair Display";
      next.theme.accentColor = "#c9a227";
      next.theme.surfaceColor = "#0b0b0c";
      next.theme.inkColor = "#f5f0e6";
      next.theme.density = "spacious";
      if (!next.meta.brandPersonality.includes("luxurious")) next.meta.brandPersonality.push("luxurious");
      notes.push("shifted the whole site to a darker, more luxurious theme with elegant typography");
    } else if (lower.includes("premium") && lower.includes("hero")) {
      for (const page of next.pages) {
        for (const s of page.sections) {
          if (s.type === "hero") {
            s.props.eyebrow = (s.props.eyebrow as string) || "An Elevated Experience";
            s.props.alignment = "center";
          }
        }
      }
      next.theme.fontHeading = "Playfair Display";
      notes.push("made the hero section feel more premium with refined typography and centered layout");
    }

    if ((lower.includes("review") || lower.includes("testimonial")) && lower.includes("add")) {
      const home = next.pages.find((p) => p.slug === "home") ?? next.pages[0];
      const hasTestimonials = home.sections.some((s) => s.type === "testimonials");
      if (!hasTestimonials) {
        const footerIndex = home.sections.findIndex((s) => s.type === "footer");
        const newSection = {
          id: `testimonials-${nanoid(6)}`,
          type: "testimonials" as const,
          props: {
            heading: "What Our Customers Say",
            items: [
              { name: "Happy Customer", quote: "A fantastic experience from start to finish.", rating: 5 },
              { name: "Repeat Client", quote: "Reliable, professional, and highly recommended.", rating: 5 },
            ],
          },
        };
        const insertAt = footerIndex === -1 ? home.sections.length : footerIndex;
        home.sections.splice(insertAt, 0, newSection);
        notes.push("added a customer reviews section");
      } else {
        notes.push("a reviews section already exists, so I left it as is");
      }
    }

    if (lower.includes("contact page") && lower.includes("add")) {
      const hasContactPage = next.pages.some((p) => p.slug === "contact");
      if (!hasContactPage) {
        const navLinks = (next.pages[0].sections.find((s) => s.type === "navbar")?.props.links ??
          []) as NavLink[];
        next.pages.push({
          id: nanoid(8),
          slug: "contact",
          name: "Contact",
          seo: {
            title: `Contact | ${next.meta.siteName}`,
            description: `Get in touch with ${next.meta.siteName}.`,
            keywords: ["contact", next.meta.siteName],
          },
          sections: [
            navbarSection(next.meta, navLinks),
            section("contact", {
              heading: "Contact Us",
              description: "We would love to hear from you.",
              phone: next.meta.phone,
              whatsapp: next.meta.whatsapp,
              address: next.meta.address,
              showForm: true,
            }),
            footerSection(next.meta, navLinks),
          ],
        });
        notes.push("added a dedicated Contact page");
      } else {
        notes.push("a Contact page already exists");
      }
    }

    if (lower.includes("mobile") && (lower.includes("better") || lower.includes("improve"))) {
      next.theme.density = "comfortable";
      notes.push(
        "increased spacing density for readability — every component in this system is responsive by default across mobile, tablet, and desktop"
      );
    }

    if (lower.includes("hero image") && (lower.includes("replace") || lower.includes("change") || lower.includes("new"))) {
      for (const page of next.pages) {
        for (const s of page.sections) {
          if (s.type === "hero") {
            s.props.image = "";
          }
        }
      }
      notes.push(
        "cleared the current hero image — upload a new photo from the asset library and it will appear here immediately"
      );
    }

    if (notes.length === 0) {
      notes.push(
        "I couldn't map that instruction to a concrete change in offline mode. Try phrasing it like one of: 'make the navbar sticky', 'change the primary color to #000000', 'add a customer reviews section', 'add a contact page', 'make it feel more luxurious'. Connect ANTHROPIC_API_KEY for full free-form natural language editing."
      );
      return { spec, summary: notes[0] };
    }

    const result = websiteSpecSchema.safeParse(next);
    if (!result.success) {
      throw new Error(
        "MockProvider produced an invalid spec while modifying: " +
          result.error.issues.map((i) => i.message).join("; ")
      );
    }

    return { spec: result.data as WebsiteSpec, summary: `Done — I ${notes.join(", and ")}.` };
  }
}
