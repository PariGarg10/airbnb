import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Airbnb switches between its mobile and desktop layouts at 744px (measured), so `md:` starts there.
    screens: { sm: "640px", md: "744px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
    extend: {
      colors: {
        ink: "var(--text)",
        muted: "var(--text-muted)",
        disabled: "var(--text-disabled)",
        faint: "#B0B0B0",
        hairline: "var(--border)",
        divider: "var(--divider)",
        soft: "var(--bg-secondary)",
        "row-hover": "var(--bg-row-hover)",
        softer: "var(--bg-quaternary)",
        rausch: "var(--brand)",
        brand: "var(--brand)",
        "brand-tertiary": "var(--brand-tertiary)",
        error: "var(--error)",
        "error-hover": "var(--error-hover)",
        quaternary: "var(--bg-quaternary)",
        "quaternary-hover": "var(--bg-quaternary-hover)",
        inverse: "var(--bg-inverse)",
        "inverse-hover": "var(--bg-inverse-hover)",
        peach: "#F7E7D7",
        "peach-ink": "#7A3E1D",
        "rare-find": "var(--bg-rare-find)",
        discount: "var(--text-discount)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        page: ["32px", { lineHeight: "36px" }],
        section: ["22px", { lineHeight: "26px" }],
        card: ["15px", { lineHeight: "19px" }],
        body: ["14px", { lineHeight: "20px" }],
        meta: ["14px", { lineHeight: "18px" }],
        label: ["12px", { lineHeight: "16px" }],
      },
      borderRadius: {
        "r-4": "var(--r-4)",
        "r-8": "var(--r-8)",
        "r-12": "var(--r-12)",
        "r-16": "var(--r-16)",
        "r-20": "var(--r-20)",
        "r-24": "var(--r-24)",
        "r-28": "var(--r-28)",
        "r-32": "var(--r-32)",
        "2xl": "var(--r-16)",
        "3xl": "var(--r-32)",
      },
      boxShadow: {
        tertiary: "var(--shadow-tertiary)",
        secondary: "var(--shadow-secondary)",
        primary: "var(--shadow-primary)",
        high: "var(--shadow-high)",
        pill: "0 3px 12px rgba(0,0,0,.10)",
        search: "0 3px 12px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.08)",
        bar: "var(--shadow-search)",
        badge: "var(--shadow-badge)",
        popover: "var(--shadow-primary)",
        toast: "0 6px 20px rgba(0,0,0,.18)",
      },
      backgroundImage: {
        search: "var(--brand-gradient)",
        "search-hover": "var(--brand-gradient-hover)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        layout: "300ms",
        "spring-fast": "var(--spring-fast-dur)",
        "spring-standard": "var(--spring-standard-dur)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease-standard)",
        standard: "var(--ease-standard)",
        "spring-fast": "var(--spring-fast)",
        "spring-standard": "var(--spring-standard)",
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        ".container-airbnb": {
          maxWidth: "2520px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "var(--page-px)",
          paddingRight: "var(--page-px)",
        },
      });
    }),
  ],
};

export default config;
