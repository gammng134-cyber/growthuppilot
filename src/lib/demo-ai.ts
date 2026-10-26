// Deterministic canned AI used in demo mode. Recognizes TASK markers at the
// end of the prompt and returns plausible, parseable JSON so the entire
// product can be explored and E2E-tested with zero API keys.

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function field(prompt: string, label: string): string {
  const m = prompt.match(new RegExp(`${label}:\\s*(.+)`, "i"));
  return m ? m[1].trim().slice(0, 200) : "";
}

function contactName(prompt: string): string {
  const name = field(prompt, "CONTACT NAME");
  return name || "there";
}

export async function fakeGenerate(
  _system: string,
  prompt: string,
): Promise<string> {
  const seed = hash(prompt);
  await new Promise((r) => setTimeout(r, 30)); // simulate latency a touch

  if (prompt.includes("TASK:KEYWORD_PLAN")) {
    const product = field(prompt, "PRODUCT BRIEF").slice(0, 60) || "your product";
    const base = [
      ["best crm for small saas teams", "commercial", 890, 4],
      ["crm vs spreadsheet for startups", "comparison", 480, 3],
      ["how to organize sales leads", "informational", 1600, 5],
      ["free sales pipeline template", "informational", 2200, 6],
      ["sales tools for first 10 customers", "informational", 320, 3],
      ["lightweight crm for indie hackers", "commercial", 210, 2],
      ["how to track customer conversations", "informational", 740, 4],
      ["founder sales process", "informational", 1100, 5],
      ["crm pricing compared", "comparison", 690, 6],
      ["when to move off spreadsheets", "informational", 410, 3],
    ];
    const keywords = base.map(([kw, intent, vol, diff], i) => ({
      keyword: kw,
      intent,
      cluster: i < 5 ? "Getting started" : "Choosing a tool",
      estVolume: vol,
      difficulty: diff,
      angle: `A practical, founder-first take on "${kw}" grounded in ${product}.`,
    }));
    return JSON.stringify({ keywords });
  }

  if (prompt.includes("TASK:ARTICLE")) {
    const keyword = field(prompt, "KEYWORD") || "growth for founders";
    const product = field(prompt, "PRODUCT BRIEF").slice(0, 60) || "your product";
    const title = `The founder's guide to ${keyword}`;
    const markdown = [
      `Most founders don't lose at ${keyword} because they lack effort — they lose because nobody built them a repeatable system. This guide fixes that, with a setup you can finish before your next coffee gets cold.`,
      `## Why ${keyword} matters more than you think`,
      `Search intent around "${keyword}" keeps growing because the old playbooks stopped working. Buyers do more of their own research, and the teams that win are the ones who show up with something genuinely useful at the exact moment a question is asked.`,
      `## A simple system that actually ships`,
      `- **Write down who you help.** One paragraph, plain words. If a stranger can't repeat it back, it's not done.`,
      `- **Pick one channel and go deep.** Depth beats presence. Ten great touches beat a hundred shallow ones.`,
      `- **Let agents do the boring parts.** Drafting, scheduling, tracking — automate the repetition, keep human judgment on every send.`,
      `- **Review weekly, not daily.** Look at what got replies and what got published, then adjust one variable at a time.`,
      `## Common mistakes to avoid`,
      `The biggest one is blast-and-pray: sending volume without context. The second is waiting for perfect copy. Your first draft is a question, not a commitment — approve, send, learn.`,
      `## Putting it together`,
      `Set the brief once, let the system produce drafts, and spend your energy on the conversations that follow. ${product} was built to make that loop boring — in the best possible way. Boring loops compound.`,
    ].join("\n\n");
    const faqs = [
      {
        q: `How long does it take to see results with ${keyword}?`,
        a: "Most teams see early signals within two weeks — first replies, first indexed pages — and compounding results after a consistent month.",
      },
      {
        q: "Do I need to write everything myself?",
        a: "No. Agents draft everything; you review and approve. Judgment stays human, repetition doesn't.",
      },
    ];
    return JSON.stringify({
      title,
      slug: keyword
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60),
      metaDescription: `A practical guide to ${keyword} — a repeatable system for founders, with tools, templates and an approval-first workflow.`,
      markdown,
      faqs,
    });
  }

  if (prompt.includes("TASK:FOLLOWUP")) {
    const name = contactName(prompt);
    return JSON.stringify({
      subject: `Re: quick nudge, ${name}`,
      body: `hey ${name} — floating this back up in case it got buried.\n\nhappy to just send over the 2-min walkthrough if that's easier. if it's not the right time, no worries at all and I'll leave you be.`,
    });
  }

  if (prompt.includes("TASK:EMAIL_DRAFT")) {
    const name = contactName(prompt);
    const company = field(prompt, "COMPANY") || "your team";
    const context = field(prompt, "WHAT THEY SAID") || "your post";
    const openers = [
      `hey ${name} — saw ${context}`,
      `hey ${name}! came across ${context}`,
    ];
    const bodies = [
      `been down that exact road with ${company} — the messy middle where everything lives in five tabs.\n\ni built a little tool that kind of "does the marketing for you": finds the right convos, drafts outreach in your voice, and writes SEO articles that actually ship. you approve everything before it goes out.\n\nwant me to send a 2-min walkthrough? no pressure either way.`,
      `we ran into the same wall building for ${company} — doing marketing manually eats the whole week.\n\nso we made agents that do the repetitive parts: personalized outreach drafts, follow-ups, and SEO articles on autopilot. you keep final say on every send.\n\ntotal punchline: less tab-juggling, more convos. want the link?`,
    ];
    return JSON.stringify({
      subject: pick(
        [
          `that ${context.slice(0, 30)} thing you mentioned`,
          `re: your post — made something for this`,
          `${company} + a fix for this`,
        ],
        seed,
      ),
      body: `${pick(openers, seed)}\n\n${pick(bodies, seed)}`,
    });
  }

  if (prompt.includes("TASK:LEAD_SCORE")) {
    const product = field(prompt, "PRODUCT BRIEF").slice(0, 60) || "your product";
    let contacts: { id?: string; name?: string; company?: string; role?: string; context?: string }[] = [];
    try {
      contacts = JSON.parse(field(prompt, "CONTACTS") || "[]");
    } catch {
      contacts = [];
    }
    const boost = (text: string) => {
      const t = text.toLowerCase();
      let b = 0;
      if (/(hiring|hire|looking for|need a|want to|interested)/.test(t)) b += 14;
      if (/(budget|pricing|price|costs|quote|trial|demo)/.test(t)) b += 11;
      if (/(soon|this week|asap|right now|today)/.test(t)) b += 8;
      if (/(founder|ceo|cto|head of|vp|director|manager)/.test(t)) b += 5;
      return b;
    };
    const scored = contacts.map((c) => {
      const id = c.id || c.name || "x";
      const text = `${c.context || ""} ${c.role || ""}`;
      const score = Math.max(5, Math.min(98, 28 + (hash(id + text) % 48) + boost(text)));
      const tier = score >= 70 ? "hot" : score >= 45 ? "warm" : "cold";
      const quote = (c.context || "their public posts").slice(0, 60);
      const rationale =
        tier === "hot"
          ? `Said \"${quote}\" — a direct buying signal for ${product}. Talk to them first.`
          : tier === "warm"
            ? `Context hints at interest (\"${quote}\") but no stated timeline. Nurture with value.`
            : `No buying signal yet in \"${quote}\". Keep on the radar, don't spend outreach budget.`;
      return { contactId: id, name: c.name || "Unknown", score, tier, rationale };
    });
    scored.sort((a, b) => b.score - a.score);
    return JSON.stringify({ contacts: scored });
  }

  if (prompt.includes("TASK:DM_DRAFT")) {
    const name = contactName(prompt);
    const context = field(prompt, "WHAT THEY SAID") || "your post";
    const product = field(prompt, "PRODUCT BRIEF").slice(0, 60) || "what we're building";
    const openers = [
      `hey ${name} — your words on ${context.slice(0, 50)} have been stuck in my head since I read them.`,
      `hey ${name} — came across what you said about ${context.slice(0, 50)} and had to save it.`,
      `hey ${name} — been thinking about your point on ${context.slice(0, 50)} all week.`,
    ];
    const bodies = [
      `we're building an agent team for people having exactly that conversation: ${product}.`,
      `that's exactly the wall ${product} was built to tear down.`,
      `we hit the same wall — so ${product} automates the boring parts and keeps the voice human.`,
    ];
    const closers = [
      `worth a 5-minute look? if it's not the right time, zero hard feelings — either way, glad you shared it publicly.`,
      `want the 2-min walkthrough? no pitch deck, no pressure — just the thing if it fits.`,
      `happy to send the short version. if the timing's wrong, say so and I'll disappear.`,
    ];
    return JSON.stringify({
      message: `${pick(openers, seed)} ${pick(bodies, seed)} ${pick(closers, seed)}`,
    });
  }

  if (prompt.includes("TASK:REPLY_DRAFT")) {
    const product = field(prompt, "PRODUCT BRIEF").slice(0, 60) || "what we've built";
    const replies = [
      `The honest answer: you don't scale personalization — you automate the boring 90% around it. Drafts, scheduling, follow-ups: agents. The judgment call and the voice stay human. That's the model behind ${product}.`,
      `We ran into this exact wall — doing it manually eats the whole week. So we automated the repetitive parts (${product}) and kept the voice human. Result: more replies, zero template energy.`,
      `Counterpoint from the trenches: the bottleneck was never effort, it was repetition. Automate the drafts, keep the opinion. ${product} exists because we lived this.`,
      `Worth a try before dismissing it: draft everything, approve selectively. ${product} does exactly that — agents draft, humans decide. The signal in your replies went up the week we started.`,
    ];
    return JSON.stringify({ reply: pick(replies, seed) });
  }

  if (prompt.includes("TASK:CONTENT_VARIANTS")) {
    const topic = field(prompt, "TOPIC") || "your latest idea";
    const product = field(prompt, "PRODUCT BRIEF").slice(0, 50) || "your product";
    return JSON.stringify({
      variants: {
        x: `hot take: ${topic}\n\nmost teams lose here not because they lack effort — they lack a system. ${product} is our answer to that. more in the thread ↓`,
        linkedin: `${topic} — the takeaway from building ${product}:\n\n• the boring 90% is automatable\n• the voice is not\n• drafts first, judgment always\n\nwhat would you add?`,
        newsletter: `This week's idea: ${topic}.\n\nWe keep coming back to it because it's where most growth efforts quietly fail. Inside: what we tried, what broke, and the system that finally made it boring. Read on →`,
        blog: `${topic} matters more than most people think. The teams that win are the ones who show up with something genuinely useful at the exact moment a question is asked. Here's the full system behind ${product} — and the one variable worth changing first.`,
      },
    });
  }

  if (prompt.includes("TASK:CHAT_ASK")) {
    const question = field(prompt, "QUESTION") || "";
    const brief = field(prompt, "PRODUCT BRIEF") || "";
    const q = question.toLowerCase();
    let answer: string;
    if (!brief) {
      answer = "I don't have the product brief yet — ask the owner to add one in Settings, and I'll answer from that.";
    } else if (/(cost|price|how much|pricing|free|plan)/.test(q)) {
      answer = "The whole stack runs on free tiers — Gemini, Resend, Vercel — so you can validate at $0. Beyond that, a human will follow up with real numbers.";
    } else if (/(spam|unsubscribe|consent|gdpr|permission)/.test(q)) {
      answer = "No. Nothing sends without your approval, there's no blast mode, and every email has a one-click unsubscribe.";
    } else if (/(security|safe|data|encrypt|store)/.test(q)) {
      answer = `Your brief, contacts and drafts stay in your workspace. Agents only read what they need to draft — and nothing sends without you approving it. (${brief.slice(0, 80)})`;
    } else if (/(who are you|what do you do|what is this|help)/.test(q)) {
      answer = `${brief.slice(0, 200) || "I'm the GrowthPilot front desk."} Ask me about pricing, safety, or how the agents work — I answer from the owner's own words, nothing invented.`;
    } else {
      answer = `Based on the owner's brief: ${brief.slice(0, 180)}. If I don't know, I say so — I never invent features, pricing or timelines. Want the human to follow up instead?`;
    }
    return JSON.stringify({ answer });
  }

  return JSON.stringify({ ok: true });
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}
