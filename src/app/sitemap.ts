import type { MetadataRoute } from "next";
import { productionOrigin } from "./site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${productionOrigin}/` }];
}
