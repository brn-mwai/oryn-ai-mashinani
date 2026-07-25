import { siteUrl } from "../lib/constants";
import { basehub } from "@/lib/basehub-stubs";
import type { MetadataRoute } from "next";

export const revalidate = 1800; // 30 minutes - adjust as needed

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data;
  try {
    data = await basehub().query({
      site: {
        pages: {
          items: {
            pathname: true,
          },
        },
        blog: {
          posts: {
            items: {
              _slug: true,
            },
          },
        },
        changelog: {
          posts: {
            items: {
              _slug: true,
            },
          },
        },
      },
    });
  } catch {
    // BaseHub not configured, return basic sitemap
    return [
      { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ];
  }

  let index = 1;
  const formattedPages = (data?.site?.pages?.items ?? []).map(
    (page: { pathname: string }) =>
      ({
        url: `${siteUrl}${page.pathname}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: index++,
      }) satisfies MetadataRoute.Sitemap[number],
  );

  const formattedBlogPosts = (data?.site?.blog?.posts?.items ?? []).map(
    (post: { _slug: string }) =>
      ({
        url: `${siteUrl}/blog/${post._slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: index++,
      }) satisfies MetadataRoute.Sitemap[number],
  );

  const formattedChangelogPosts = (data?.site?.changelog?.posts?.items ?? []).map(
    (post: { _slug: string }) =>
      ({
        url: `${siteUrl}/changelog/${post._slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: index++,
      }) satisfies MetadataRoute.Sitemap[number],
  );

  const routes = [...formattedPages, ...formattedBlogPosts, ...formattedChangelogPosts];
  return routes.length > 0 ? routes : [{ url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
}
