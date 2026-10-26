import { ImageResponse } from "next/og";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("missing slug", { status: 400 });

  const store = await getStore();
  const article = await store.getArticleBySlug(slug);
  if (!article) return new Response("not found", { status: 404 });

  const title =
    article.title.slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, "").trim() ||
    "GrowthPilot Blog";
  const meta =
    article.metaDescription.slice(0, 100).replace(/[^a-zA-Z0-9\s]/g, "").trim() ||
    "Written by GrowthPilot's SEO Agent";

  function makeWords(text: string) {
    return text.split(" ").map((word, i) => (
      <span key={i}>
        {i > 0 && " "}
        {word}
      </span>
    ));
  }

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px",
        background:
          "linear-gradient(135deg, #0a0c14 0%, #10131f 50%, #0f2a3a 100%)",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          fontWeight: "800",
          color: "#ffffff",
          fontSize: "20px",
        }}
      >
        G
      </div>
      <p
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#818cf8",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        GrowthPilot Blog
      </p>
      <h1
        style={{
          fontSize: "48px",
          fontWeight: "800",
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: "1000px",
          whiteSpace: "nowrap",
        }}
      >
        {makeWords(title)}
      </h1>
      <p
        style={{
          fontSize: "22px",
          color: "#94a3b8",
          marginTop: "20px",
          maxWidth: "900px",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {makeWords(meta)}
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
