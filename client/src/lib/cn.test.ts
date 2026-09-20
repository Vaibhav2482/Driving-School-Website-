import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy values and skips falsy ones", () => {
    const enabled = false as boolean;
    expect(cn("a", false, null, undefined, "", "b", enabled && "c")).toBe("a b");
  });

  it("flattens nested arrays", () => {
    expect(cn("a", ["b", ["c", false]])).toBe("a b c");
  });
});
