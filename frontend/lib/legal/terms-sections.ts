import { APP_NAME } from "@/lib/brand";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
};

const brand = APP_NAME;

export const TERMS_REGION_NOTICE = [
  `If your country of residence or establishment is within the European Economic Area (“EEA”), Switzerland or the United Kingdom, the Terms of Service for European Users apply to you.`,
  `If your country of residence or establishment is outside of the EEA, Switzerland, Australia, and the United Kingdom, the Terms of Service for Users outside of the EEA, UK, and Australia apply to you.`,
  `If your country of residence or establishment is in Australia, the Terms of Service for Australian Users apply to you.`,
];

export const TERMS_REFERENCED_DOCS = [
  "Payments Terms of Service",
  "Privacy Policy",
  "Service Fees Policy",
  "Offline Fee Policy",
  "Off-Platform Policy",
  "Taxes Policy",
  "Host Privacy Standards",
  "Additional Terms for Service and Experience Hosts",
  "Cancellation Policies for Homes",
  "Cancellation Policies for Service and Experience Listings",
  "Major Disruptive Events Policy",
  "Rebooking and Refund Policy for Homes",
  "Refund Policy for Services and Experiences",
  "Resolution Centre page",
  "Host Damage Protection Terms",
  "Reviews Policy",
  "Community Policies",
  "Content Policy",
  "Nondiscrimination Policy",
  "Services and Experiences Standards and Requirements",
];

export const TERMS_TOC = [
  { id: "guest-1", label: `1. Searching and Booking on ${brand}.` },
  { id: "guest-2", label: "2. Cancellations, Reservation Issues, Refunds and Booking Modifications." },
  { id: "guest-3", label: "3. Your Responsibilities." },
  { id: "host-4", label: `4. Hosting on ${brand}.` },
  { id: "host-5", label: "5. Managing Your Listing." },
  { id: "host-6", label: "6. Cancellations, Reservation Issues, and Booking Modifications." },
  { id: "host-7", label: "7. Taxes." },
  { id: "general-8", label: "8. Reviews." },
  { id: "general-9", label: "9. Content." },
  { id: "general-10", label: "10. Fees." },
  { id: "general-11", label: `11. ${brand} Platform Rules.` },
  { id: "general-25", label: "25. United States Dispute Resolution and Arbitration Agreement." },
];

export const TERMS_EUROPEAN_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: `Terms of Service for European Users`,
    paragraphs: [
      `Please note that ${brand} is not committed nor obliged to use an alternative dispute resolution entity within the meaning of Directive 2013/11 EU to resolve disputes with consumers.`,
      `Section 25 of these Terms contains an arbitration agreement and class action waiver that applies to all claims brought against ${brand} in the United States. Please read them carefully.`,
      `Last Updated: February 5, 2026`,
      `Thank you for using ${brand}!`,
      `These Terms of Service for European Users (“Terms”) are a binding legal agreement between you and ${brand} that govern your right to use the websites, applications, and other offerings from ${brand} (collectively, the “${brand} Platform”). When used in these Terms, “${brand},” “we,” “us,” or “our” refers to the ${brand} entity set out on Schedule 1 with whom you are contracting.`,
      `The ${brand} Platform offers an online venue that enables users (“Members”) to publish, offer, search for, and book services. Members who publish and offer services are “Hosts” and Members who search for, book, or use services are “Guests, Participants, or Travelers.” Hosts offer accommodations (“Accommodations”), activities, excursions and events such as tours, classes, live performances, or outdoor activities which are designated as experiences on the ${brand} Platform (“Experiences”), services and activities often provided at an Accommodation such as personal trainers, wellness sessions, or meal preparation which are designated as services on the ${brand} Platform (“Services”), and a variety of travel and other services (collectively, “Host Services,” and each Host Service offering, a “Listing”). As the provider of the ${brand} Platform, ${brand} does not own, control, offer or manage any Listings, Host Services, or tourism services. ${brand} is not a party to the contracts entered into directly between Hosts and Guests, nor is ${brand} a real estate broker, travel agency, insurer or an organiser or retailer of travel packages under Directive (EU) 2015/2302. ${brand} is not acting as an agent in any capacity for any Member, except as specified in the Payments Terms of Service (“Payment Terms”).`,
    ],
  },
  {
    id: "guest-1",
    title: `1. Searching and Booking on ${brand}.`,
    paragraphs: [
      "1.1 Searching and Recommendations. You can search for Host Services by using criteria like the type of Host Service, type of listing, travel destination, travel dates, and number of guests. You can also use filters to refine your search results. Search results are based on their relevance to your search and other criteria.",
      "1.2 Booking. When you book a Listing, you are agreeing to pay all charges for your booking including the Listing price, applicable fees like the service fee, offline fees, taxes and any other items identified during checkout (collectively, “Total Price”). When you receive the booking confirmation, a contract for Host Services (a \"Reservation\") is formed directly between you and the Host.",
      "1.3 Accommodation Reservations. An Accommodation Reservation is a limited license to enter, occupy and use the Accommodation. The Host retains the right to re-enter the Accommodation during your stay, to the extent it is reasonably necessary, permitted by your contract with the Host, and permitted by applicable law.",
      "1.4 Reservations for Services, Experiences, and Other Host Services. A Service, Experience, or other Host Service Reservation entitles you to participate in, attend, or use that Service, Experience, or Host Service. You are responsible for confirming that you, and anyone you invite, meet minimum age, proficiency, fitness or other requirements.",
    ],
  },
  {
    id: "guest-2",
    title: "2. Cancellations, Reservation Issues, Refunds and Booking Modifications.",
    paragraphs: [
      "2.1 Cancellations, Reservation Issues, and Refunds. In general, if you cancel a Reservation, the amount refunded to you is determined by the cancellation policy that applies to that Reservation. But, in certain situations, other policies may take precedence and determine what amount is refunded to you.",
      "2.2 Booking Modifications. Hosts and Guests are responsible for any booking modifications they agree to make via the Platform or direct customer service to make on their behalf (\"Booking Modifications\"), and agree to pay any additional amounts, fees or taxes associated with any Booking Modification.",
    ],
  },
  {
    id: "guest-3",
    title: "3. Your Responsibilities.",
    paragraphs: [
      "You are responsible for your own acts and omissions and are also responsible for the acts and omissions of anyone you invite to join or provide access to any Accommodation, Common Areas, or any Service, Experience, or other Host Service. You must act with integrity, treat others with respect and comply with applicable laws at all times.",
    ],
  },
  {
    id: "host-4",
    title: `4. Hosting on ${brand}.`,
    paragraphs: [
      "4.1 Host. As a Host, we offer you the right to use the Platform in accordance with these Terms to share your Accommodation, Service, Experience, or other Host Service with our community of Guests.",
      "4.2 Contracting with Guests. When you accept a booking request, or receive a booking confirmation through the Platform, you are entering into a contract directly with the Guest.",
      "4.3 Independence of Hosts. Your relationship with us is that of an independent individual or entity and not an employee, agent, joint venturer or partner of ours, except that payment entities act as a payment collection agent as described in the Payments Terms.",
    ],
  },
  {
    id: "host-5",
    title: "5. Managing Your Listing.",
    paragraphs: [
      "5.1 Creating and Managing Your Listing. Your Listing must include complete and accurate information about your Host Service, your price (including any additional charges), and any rules or requirements that apply to your Guests or Listing.",
      "5.2 Know Your Legal Obligations. You are responsible for understanding and complying with any laws, rules, regulations and contracts with third parties that apply to your Listing or Host Services.",
      "5.3 Search Results. The ranking and display of Listings in search results depends on guest search parameters, listing characteristics, guest experience, host and listing requirements, and guest preferences and history.",
    ],
  },
  {
    id: "general-25",
    title: "25. United States Dispute Resolution and Arbitration Agreement.",
    paragraphs: [
      "PLEASE READ THE FOLLOWING PARAGRAPHS CAREFULLY BECAUSE THEY PROVIDE THAT YOU AND WE AGREE TO RESOLVE ALL DISPUTES BETWEEN US THROUGH BINDING INDIVIDUAL ARBITRATION AND INCLUDE A CLASS ACTION WAIVER AND JURY TRIAL WAIVER.",
      "This Arbitration Agreement only applies to you if your country of residence or establishment is the United States. Where it applies, disputes are subject to a mandatory pre-arbitration notice period and binding arbitration administered in accordance with the terms set out in this Section.",
    ],
  },
];

export const TERMS_RELATED = [
  { title: "Payments Terms of Service", category: "Legal terms", note: "Please review our Payments Terms of Service." },
  { title: "Ground rules for home guests", category: "Community policy", note: "Please review our ground rules for home guests." },
] as const;
