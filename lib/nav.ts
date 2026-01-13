// lib/nav.ts

export type NavLink = {
  key: string;
  label: string;
  href: `/${string}`;
};

export type NavGroup = {
  key: string;
  label: string;
  children: ReadonlyArray<NavLink>;
};

export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "home", label: "Home", href: "/" },
  { key: "product", label: "Product", href: "/product" },
  { key: "solutions", label: "Solutions", href: "/solutions" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "tokenomics", label: "Tokenomics", href: "/tokenomics" },

  {
    key: "resources",
    label: "Resources",
    children: [
      { key: "how-it-works", label: "How It Works", href: "/how-it-works" },
      { key: "roadmap", label: "Roadmap", href: "/roadmap" },
      { key: "evidence", label: "Evidence", href: "/evidence" },
    ],
  },

  { key: "download", label: "Download", href: "/download" },
  { key: "ir", label: "IR", href: "/ir" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
];

/** ✅ ใช้สำหรับ MobileMenu เท่านั้น */
export function flattenNav(items: ReadonlyArray<NavItem>): NavLink[] {
  const out: NavLink[] = [];
  for (const it of items) {
    if ("children" in it) {
      out.push(...it.children);
    } else {
      out.push(it);
    }
  }
  return out;
}
