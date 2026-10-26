import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import Link from "next/link";
import type { Metadata } from "next";

import { getStore } from "@/lib/storage";
import { renderMarkdown, readingTime } from "@/lib/markdown";
import { siteUrl } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parent: unknown,
): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const article = await store.getArticleBySlug(slug);
  if (!article) return {};
  const title = article.title;
  const description = article.metaDescription;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl()}/blog/${slug}`,
      images: [
        {
          url: `${siteUrl()}/api/blog/og?slug=${slug}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl()}/api/blog/og?slug=${slug}`],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore();
  const article = await store.getArticleBySlug(slug);
  if (!article) notFound();

  const html = renderMarkdown(article.markdown);
  const rt = readingTime(article.markdown);

  return (
    <article
      className="mx-auto max-w-3xl px-6 pb-24 pt-24 text-slate-300"
      style={{ colorScheme: "dark" as const } as React.CSSProperties}
    >
      {/* breadcrumb */}
      <nav className="text-xs text-slate-600">
        <Link
          href="/blog"
          className="hover:text-slate-400 transition-colors"
        >
          Blog &rarr;
        </Link>
      </nav>

      <header className="mt-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
          <time dateTime={article.publishedAt?.toISOString() ?? ""}>
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </time>
          {article.keyword && (
            <>
              <span className="mx-1">·</span>
              <span>targeted at &ldquo;{article.keyword}&rdquo;</span>
            </>
          )}
          <span className="mx-1">·</span>
          <span>{rt} min read</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white leading-tight">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-400">
          {article.metaDescription}
        </p>
      </header>

      <hr className="my-8 border-white/10" />
      <div
        className="prose-article"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {article.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">FAQ</h2>
          <div className="space-y-4">
            {article.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="text-base font-medium text-white">{f.q}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <hr className="my-12 border-white/10" />
      <footer className="text-sm text-slate-500">
        Written by GrowthPilot&apos;s SEO Agent. Reviewed and published by a human.
      </footer>
    </article>
  );
}
