import * as React from "react";
import type { Metadata } from "next";

import { getStore } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "GrowthPilot's SEO Agent writes and publishes articles on an autopilot cadence — reviewed by humans, ranked by Google.",
  openGraph: {
    title: "Blog · GrowthPilot",
    description:
      "GrowthPilot's SEO Agent writes and publishes articles on an autopilot cadence — reviewed by humans, ranked by Google.",
    type: "website",
    url: "/blog",
    siteName: "GrowthPilot",
  },
};

export default async function BlogPage() {
  const store = await getStore();
  const articles = await store.listPublishedArticles();

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-24">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Blog</h1>
        <p className="mt-3 text-slate-400">
          Every article is planned from a keyword list, drafted by the SEO Agent,
          reviewed (or auto-published, if you toggled it), and shipped to a real
          accessible URL at{" "}
          <code className="text-slate-300">yourdomain.com/blog/...</code> with
          schema, sitemap and OG images.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
          <p className="text-lg">No articles published yet.</p>
          <p className="mt-1">
            Head to the SEO Agent, generate a keyword plan, write one, and hit
            publish. It&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {articles.map((a) => (
            <ArticleLink key={a.slug} href={`/blog/${a.slug}`} article={a} />
          ))}
        </ul>
      )}
    </main>
  );
}

function ArticleLink({
  href,
  article,
}: {
  href: string;
  article: {
    title: string;
    slug: string;
    metaDescription: string;
    publishedAt: Date | null;
    updatedAt: Date | null;
  };
}) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
    >
      <span className="flex min-w-0 justify-between gap-4">
        <span className="font-medium text-white">{article.title}</span>
        <Date date={article.publishedAt ?? article.updatedAt} />
      </span>
      <p className="text-sm text-slate-500">{article.metaDescription}</p>
    </a>
  );
}

function Date({ date }: { date: Date | null }) {
  if (!date) return null;
  // DB rows come back loosely typed; the value is always a Date at runtime.
  // Cast is a compile-time assertion — the value is `date instanceof Date`
  // verified above, so `d` is always a real Date here.
  const d = date instanceof Date ? date : (date as unknown) as Date;

  return (
    <time
      className="text-xs text-slate-500"
      dateTime={d.toISOString()}
    >
      {d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </time>
  );
}
