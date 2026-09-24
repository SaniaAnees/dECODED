import {
  COMPANY_SOCIALS,
  FOUNDER,
  PROD_URLS,
  SITE_NAME,
} from "@/lib/site";

const ORIGIN = PROD_URLS.main;
const ORGANIZATION_ID = `${ORIGIN}/#organization`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const ABOUT_CANONICAL = `${ORIGIN}/about`;
const FOUNDER_ID = `${ABOUT_CANONICAL}#sania-anees`;

/** Only resolvable URLs belong in `sameAs`; placeholders are dropped. */
function resolvable(urls: string[]): string[] {
  return urls.filter((url) => /^https?:\/\//i.test(url));
}

const ABOUT_DESCRIPTION =
  "Learn what UseCoded is building around AI coding harnesses, context efficiency, personalized development workflows, and accessible AI development.";

/**
 * Schema.org graph for the about page. Kept consistent with the visible page:
 * organization, its founder, the site, and the page itself.
 */
export function buildAboutJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "UseCoded",
        alternateName: SITE_NAME,
        url: ORIGIN,
        description:
          "Developer infrastructure for AI-assisted software development: a coding harness and token/context optimization layer.",
        founder: { "@id": FOUNDER_ID },
        sameAs: resolvable(
          COMPANY_SOCIALS.map((account) => account.href),
        ),
      },
      {
        "@type": "Person",
        "@id": FOUNDER_ID,
        name: FOUNDER.name,
        jobTitle: FOUNDER.title,
        url: ABOUT_CANONICAL,
        worksFor: { "@id": ORGANIZATION_ID },
        sameAs: resolvable(FOUNDER.socials.map((account) => account.href)),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: ORIGIN,
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "AboutPage",
        "@id": `${ABOUT_CANONICAL}#webpage`,
        url: ABOUT_CANONICAL,
        name: "About UseCoded",
        description: ABOUT_DESCRIPTION,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        mainEntity: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}
