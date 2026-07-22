import { getSiteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export function HomeStructuredData() {
  const siteUrl = getSiteUrl();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Công ty TNHH TM Nguyên Liệu Hưng Phát",
    url: siteUrl,
    logo: `${siteUrl}/logo-transparent.png`,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nguyên Liệu Hưng Phát",
    url: siteUrl,
    description:
      "Hưng Phát chuyên thương mại và phân phối nguyên liệu pha chế, nguyên liệu mì cay và hàng đông lạnh cho cửa hàng, đại lý và đối tác kinh doanh.",
    image: siteAssets.seo.og,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/san-pham?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
