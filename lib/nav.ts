// lib/nav.ts
export type NavItem = { key: string; label: string; href: `/${string}` };

export const NAV_ITEMS = [
  { key: "home",      label: "Home",      href: "/" },
  { key: "product",   label: "Product",   href: "/product" },
  { key: "solutions", label: "Solutions", href: "/solutions" },
  { key: "pricing",   label: "Pricing",   href: "/pricing" },
  { key: "tokenomics", label: "Tokenomics", href: "/tokenomics" },
  { key: "resources", label: "Resources", href: "/resources" },
 { key: "download", label: "Download", href: "/download" },
  { key: "ir",        label: "IR",        href: "/ir" },
  { key: "contact",   label: "Contact",   href: "/contact" },
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
] as const satisfies ReadonlyArray<NavItem>;
