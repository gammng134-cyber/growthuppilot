import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and keeps duplicates", () => {
    expect(cn("a b", "b c", "d")).toBe("a b b c d");
  });

  it("respects falsey classes", () => {
    expect(cn("a", false, "b", undefined, "c")).toBe("a b c");
  });
});
