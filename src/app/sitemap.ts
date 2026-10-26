import { MetadataRoute } from "next";
import { getStore } from "@/lib/storage";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await getStore();
  const articles = await store.listPublishedArticles();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl(), lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl()}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl()}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl()}/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPrefix = `${siteUrl()}/blog/`;
  const articleRoutes = articles
    .filter((a) => !a.slug.includes("/"))
    .map((a) => ({
      url: `${blogPrefix}${a.slug}`,
      lastModified: a.publishedAt ?? a.updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...articleRoutes];
}
