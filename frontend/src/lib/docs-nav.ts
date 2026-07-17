export interface DocsNavItem {
  title: string;
  href: string;
}

export interface DocsNavSection {
  section: string;
  items: DocsNavItem[];
}

export const DOCS_NAV: DocsNavSection[] = [
  {
    section: "Getting started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    section: "Concepts",
    items: [
      { title: "Core concepts", href: "/docs/concepts" },
      { title: "The infrastructure", href: "/docs/infrastructure" },
    ],
  },
  {
    section: "Guides",
    items: [{ title: "Integration guide", href: "/docs/integration-guide" }],
  },
  {
    section: "Reference",
    items: [
      { title: "API reference", href: "/docs/api-reference" },
      { title: "Errors", href: "/docs/errors" },
    ],
  },
];
