import type { MetadataRoute } from "next";

// Keep the admin and staff areas out of search engines. The staff view has
// weaker protection (URL + shared PIN), so this is a deliberate second guard.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/admin", "/staff"],
    },
  };
}
