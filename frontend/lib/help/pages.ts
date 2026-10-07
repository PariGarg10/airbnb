import { APP_NAME } from "@/lib/brand";

export type HelpPage = {
  slug: string;
  title: string;
  category: "Support" | "Hosting" | "OpenStay";
  summary: string;
  body: string[];
  links?: { label: string; href: string }[];
};

function p(...paragraphs: string[]) {
  return paragraphs;
}

export const HELP_PAGES: HelpPage[] = [
  {
    slug: "help-centre",
    title: "Help Centre",
    category: "Support",
    summary: "Answers about bookings, payments, and your account.",
    body: p(
      `Welcome to the ${APP_NAME} Help Centre. Browse topics below or search above for step-by-step guides.`,
      "For booking changes, cancellations, and refunds, sign in and open Trips. For payment issues, check your email for receipts and contact us with your confirmation code.",
    ),
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Your trips", href: "/trips" },
    ],
  },
  {
    slug: "safety-issue",
    title: "Get help with a safety issue",
    category: "Support",
    summary: "If you are in immediate danger, contact local emergency services first.",
    body: p(
      "Your safety matters. If you are experiencing an emergency, call your local emergency number right away.",
      `After you are safe, contact ${APP_NAME} support from your trip details page. Include your reservation dates, listing name, and what happened. We may pause payouts or remove a listing while we review.`,
    ),
  },
  {
    slug: "aircover",
    title: "AirCover",
    category: "Support",
    summary: "Protection for eligible booking issues when you travel.",
    body: p(
      "AirCover includes rebooking assistance and refunds when a Host cancels or a serious listing issue prevents your stay.",
      "Open your trip, choose Get help, and follow the prompts. Keep photos or messages that show the issue.",
    ),
  },
  {
    slug: "anti-discrimination",
    title: "Anti-discrimination",
    category: "Support",
    summary: "Everyone belongs on our platform.",
    body: p(
      `${APP_NAME} prohibits discrimination based on race, colour, ethnicity, national origin, religion, sexual orientation, gender identity, marital status, disability, or other protected characteristics.`,
      "Report discriminatory behaviour from a trip or message thread. We investigate and may suspend accounts that violate this policy.",
    ),
  },
  {
    slug: "disability-support",
    title: "Disability support",
    category: "Support",
    summary: "Accessibility information and assistance requests.",
    body: p(
      "Listings may describe step-free access, wide doorways, or accessible bathrooms. Use filters and read listing details before you book.",
      "Need an accommodation for a disability-related request? Message the Host before booking or contact support with your reservation ID.",
    ),
  },
  {
    slug: "cancellation-options",
    title: "Cancellation options",
    category: "Support",
    summary: "How cancellation policies affect refunds.",
    body: p(
      "Each listing shows its cancellation policy before you pay. Flexible, moderate, and strict policies define how much is refunded and when.",
      "Major disruptive events may qualify for additional refunds under our Major Disruptive Events Policy. Pending request-to-book stays can be withdrawn before the Host responds.",
    ),
    links: [{ label: "Manage a trip", href: "/trips" }],
  },
  {
    slug: "report-neighbourhood",
    title: "Report neighbourhood concern",
    category: "Support",
    summary: "Share concerns about parties, noise, or safety in a neighbourhood.",
    body: p(
      "If a stay is disrupting your neighbourhood, document dates, address, and nature of the issue.",
      "Submit a report with as much detail as you can. We enforce our party and community rules and may restrict bookings on affected listings.",
    ),
  },
  {
    slug: "host-your-home",
    title: `${APP_NAME} your home`,
    category: "Hosting",
    summary: "List a home and start hosting.",
    body: p(
      "Create a listing with photos, pricing, house rules, and availability. You control your calendar and who can book.",
      "Switch to hosting from the menu to open the listing editor and publish when your profile is complete.",
    ),
    links: [{ label: "Start hosting", href: "/host" }],
  },
  {
    slug: "host-your-experience",
    title: `${APP_NAME} your experience`,
    category: "Hosting",
    summary: "Offer an experience to guests.",
    body: p(
      "Experiences are activities you lead in person—food walks, workshops, outdoor adventures, and more.",
      "Browse the Experiences tab for inspiration. Host onboarding for experiences opens from the hosting menu when available in your region.",
    ),
    links: [{ label: "Explore experiences", href: "/experiences" }],
  },
  {
    slug: "host-your-service",
    title: `${APP_NAME} your service`,
    category: "Hosting",
    summary: "Offer services at a guest's stay.",
    body: p(
      "Services include photography, private chefs, massage, training, and other in-home services guests can add to a trip.",
      "See the Services tab for examples. Service hosts set their own rates and availability.",
    ),
    links: [{ label: "Explore services", href: "/services" }],
  },
  {
    slug: "aircover-for-hosts",
    title: "AirCover for Hosts",
    category: "Hosting",
    summary: "Host damage protection and support for eligible claims.",
    body: p(
      "Host damage protection may cover eligible damage caused by guests when documented through the Resolution Centre.",
      "File promptly after checkout with photos and receipts. Payouts may be held while a claim is reviewed.",
    ),
  },
  {
    slug: "hosting-resources",
    title: "Hosting resources",
    category: "Hosting",
    summary: "Guides on pricing, taxes, and responsible hosting.",
    body: p(
      "Learn about setting competitive rates, weekend adjustments, and cleaning fees.",
      "Review local short-term rental rules, registration requirements, and tax obligations for your city.",
    ),
    links: [{ label: "Host dashboard", href: "/host" }],
  },
  {
    slug: "community-forum",
    title: "Community forum",
    category: "Hosting",
    summary: "Connect with other Hosts.",
    body: p(
      "Share tips on guest communication, interior design, and seasonal pricing with Hosts in your region.",
      "Forum access is rolling out; check the hosting menu for the latest availability.",
    ),
  },
  {
    slug: "hosting-responsibly",
    title: "Hosting responsibly",
    category: "Hosting",
    summary: "Safety, noise, and neighbour considerations.",
    body: p(
      "Set clear house rules, quiet hours, and checkout instructions. Respond quickly to guest messages.",
      "Avoid unauthorized parties, respect occupancy limits, and follow applicable short-term rental laws.",
    ),
  },
  {
    slug: "hosting-class",
    title: "Join a free hosting class",
    category: "Hosting",
    summary: "Live sessions for new and experienced Hosts.",
    body: p(
      "Free online classes cover photography, pricing, and five-star hospitality.",
      "Sign up from the hosting hub when classes are scheduled in your time zone.",
    ),
  },
  {
    slug: "find-cohost",
    title: "Find a co-host",
    category: "Hosting",
    summary: "Partner with someone to manage your listing.",
    body: p(
      "Co-hosts can help with messaging, cleaning coordination, and check-in when you are away.",
      "Invite a co-host from your listing settings and define payout sharing in writing before you go live.",
    ),
  },
  {
    slug: "refer-host",
    title: "Refer a host",
    category: "Hosting",
    summary: "Invite friends to host on the platform.",
    body: p(
      "When someone you refer completes their first eligible booking, you may receive a referral reward where the program is available.",
      "Share your personal invite link from the hosting menu. Terms and reward amounts vary by region.",
    ),
  },
  {
    slug: "summer-release",
    title: "2026 Summer Release",
    category: "OpenStay",
    summary: "What's new this season.",
    body: p(
      "Improved search filters, clearer pricing on cards, and faster map browsing on desktop.",
      "Host tools include calendar updates and clearer earnings breakdowns. More languages and currencies are on the way.",
    ),
  },
  {
    slug: "newsroom",
    title: "Newsroom",
    category: "OpenStay",
    summary: "Company news and announcements.",
    body: p(
      `${APP_NAME} shares product updates, community stories, and policy changes here.`,
      "For press inquiries, email press@openstay.example with your outlet and deadline.",
    ),
  },
  {
    slug: "careers",
    title: "Careers",
    category: "OpenStay",
    summary: "Work with us.",
    body: p(
      "We hire engineers, designers, and operations specialists who care about travel and trust.",
      "Open roles are posted on our careers page. Remote-friendly teams work across India and Europe.",
    ),
  },
  {
    slug: "investors",
    title: "Investors",
    category: "OpenStay",
    summary: "Information for investors.",
    body: p(
      "Financial reports and investor events are published quarterly.",
      "Contact investors@openstay.example for shareholder services.",
    ),
  },
  {
    slug: "org-emergency",
    title: `${APP_NAME}.org emergency stays`,
    category: "OpenStay",
    summary: "Free or discounted stays in crisis situations.",
    body: p(
      `${APP_NAME}.org connects people who need emergency housing with Hosts who can help.`,
      "Eligibility is determined by partner nonprofits. Learn more at org.openstay.example.",
    ),
  },
  {
    slug: "sitemap",
    title: "Sitemap",
    category: "OpenStay",
    summary: "Browse all main sections.",
    body: p("Quick links to primary areas of the site."),
    links: [
      { label: "Home", href: "/" },
      { label: "Homes browse", href: "/?view=homes" },
      { label: "Search", href: "/s" },
      { label: "Experiences", href: "/experiences" },
      { label: "Services", href: "/services" },
      { label: "Wishlists", href: "/wishlists" },
      { label: "Trips", href: "/trips" },
      { label: "Hosting", href: "/host" },
      { label: "Help Centre", href: "/help/help-centre" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
  {
    slug: "company-details",
    title: "Company details",
    category: "OpenStay",
    summary: "Legal entity and contact information.",
    body: p(
      `${APP_NAME}, Inc. · Registered office: Bengaluru, Karnataka, India`,
      "Support: help@openstay.example · Grievance officer: grievance@openstay.example",
    ),
  },
];

export const HELP_BY_SLUG = Object.fromEntries(HELP_PAGES.map((page) => [page.slug, page])) as Record<
  string,
  HelpPage
>;

export const FOOTER_LINKS = {
  support: [
    { label: "Help Centre", slug: "help-centre" },
    { label: "Get help with a safety issue", slug: "safety-issue" },
    { label: "AirCover", slug: "aircover" },
    { label: "Anti-discrimination", slug: "anti-discrimination" },
    { label: "Disability support", slug: "disability-support" },
    { label: "Cancellation options", slug: "cancellation-options" },
    { label: "Report neighbourhood concern", slug: "report-neighbourhood" },
  ],
  hosting: [
    { label: `${APP_NAME} your home`, slug: "host-your-home" },
    { label: `${APP_NAME} your experience`, slug: "host-your-experience" },
    { label: `${APP_NAME} your service`, slug: "host-your-service" },
    { label: "AirCover for Hosts", slug: "aircover-for-hosts" },
    { label: "Hosting resources", slug: "hosting-resources" },
    { label: "Community forum", slug: "community-forum" },
    { label: "Hosting responsibly", slug: "hosting-responsibly" },
    { label: "Join a free hosting class", slug: "hosting-class" },
    { label: "Find a co-host", slug: "find-cohost" },
    { label: "Refer a host", slug: "refer-host" },
  ],
  about: [
    { label: "2026 Summer Release", slug: "summer-release" },
    { label: "Newsroom", slug: "newsroom" },
    { label: "Careers", slug: "careers" },
    { label: "Investors", slug: "investors" },
    { label: `${APP_NAME}.org emergency stays`, slug: "org-emergency" },
  ],
} as const;
