import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Cloudflare Email Worker uses CJS require() by design — not bundled by Next.js
  {
    files: ["cloudflare/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // File-level rule overrides for valid React patterns flagged by the React Compiler lint rules.
  // These patterns are correct at runtime; the compiler rules are overly conservative here.
  // Note: [kloId] and [ticketId] path segments use * to avoid glob special-character issues.
  {
    files: [
      "app/dashboard/kloes/*/checklist-panel.tsx",
      "components/Tooltip.tsx",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    files: [
      "components/ThemeToggle.tsx",
      "components/CookieBanner.tsx",
      "components/GettingStartedWizard.tsx",
      "components/IdleTimeout.tsx",
      "app/superadmin/tickets/*/StaffReplyForm.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "app/dashboard/page.tsx",
      "components/Tooltip.tsx",
    ],
    rules: {
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
