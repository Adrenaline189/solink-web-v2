// lib/nav.ts
export type NavItem = { key: string; label: string; href: `/${string}` };

export const NAV_ITEMS = [
  { key: "home",      label: "Home",      href: "/" },
  { key: "product",   label: "Product",   href: "/product" },
  { key: "solutions", label: "Solutions", href: "/solutions" },
  { key: "pricing",   label: "Pricing",   href: "/pricing" },
  { key: "customers", label: "Customers", href: "/customers" },
  { key: "resources", label: "Resources", href: "/resources" },
  { key: "ir",        label: "IR",        href: "/ir" },
  { key: "contact",   label: "Contact",   href: "/contact" },
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "settings",  label: "Settings",  href: "/settings" },
] as const satisfies ReadonlyArray<NavItem>;
