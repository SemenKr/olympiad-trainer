import type { MetadataRoute } from "next";
import { productionOrigin } from "./site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    // Crawlers must be able to read noindex directives and render Home assets.
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${productionOrigin}/sitemap.xml`,
  };
}
