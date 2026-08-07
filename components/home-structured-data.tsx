import {
  COMPANY_ADDRESS_LOCALITY,
  COMPANY_ADDRESS_REGION,
  COMPANY_ADDRESS_STREET,
  COMPANY_EMAIL,
  COMPANY_NAME,
  ZALO_URL,
} from "@/lib/contact";
import { getSiteUrl } from "@/lib/site";
import { siteAssets } from "@/lib/site-assets";

export function HomeStructuredData() {
  const siteUrl = getSiteUrl();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo-transparent.png`,
    email: COMPANY_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY_ADDRESS_STREET,
      addressLocality: COMPANY_ADDRESS_LOCALITY,
      addressRegion: COMPANY_ADDRESS_REGION,
      addressCountry: "VN",
    },
    sameAs: [ZALO_URL],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nguyên Liệu Hưng Phát",
    url: siteUrl,
    description:
      "Hưng Phát thương mại và phân phối trà sữa & pha chế, mì cay, đông lạnh, ăn vặt, bao bì và gia vị & sốt cho cửa hàng, đại lý và đối tác kinh doanh.",
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
