import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetContentForTests } from "@/features/public/content";

// Headroom for slow or busy machines.
configure({ asyncUtilTimeout: 10_000 });

afterEach(() => {
  cleanup();
  // Tests may swap the site content; always start the next test from the real content.
  resetContentForTests();
});
