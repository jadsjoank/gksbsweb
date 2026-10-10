import { MetadataRoute } from "next";
import { supabaseAdmin } from "lib/supabaseAdmin";

const baseUrl = "https://gksbstanjungkarang.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: events, error: eventsError }, { data: news, error: newsError }] =
    await Promise.all([
      supabaseAdmin
        .from("events")
        .select("id,updated_at,created_at")
        .eq("is_active", true),
      supabaseAdmin
        .from("church_news")
        .select("id,updated_at,created_at")
        .eq("is_published", true),
    ]);

  if (eventsError) {
    console.error("Failed to load published events for sitemap:", eventsError.message);
  }
  if (newsError) {
    console.error("Failed to load published church news for sitemap:", newsError.message);
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/events`, lastModified: new Date() },
    { url: `${baseUrl}/ministries`, lastModified: new Date() },
    { url: `${baseUrl}/news`, lastModified: new Date() },
    { url: `${baseUrl}/warta-gereja`, lastModified: new Date() },
    { url: `${baseUrl}/ecommerce`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    { url: `${baseUrl}/donate`, lastModified: new Date() },
  ];

  return [
    ...staticPages,
    ...(events ?? []).map((item) => {
      const timestamp = item.updated_at ?? item.created_at;
      return {
        url: `${baseUrl}/events/${item.id}`,
        ...(timestamp ? { lastModified: new Date(timestamp) } : {}),
      };
    }),
    ...(news ?? []).map((item) => {
      const timestamp = item.updated_at ?? item.created_at;
      return {
        url: `${baseUrl}/warta-gereja/${item.id}`,
        ...(timestamp ? { lastModified: new Date(timestamp) } : {}),
      };
    }),
  ];
}
