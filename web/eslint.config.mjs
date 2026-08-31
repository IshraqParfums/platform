import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noEmDash = [
  {
    selector: "JSXText[value=/\\u2014/]",
    message:
      "No em dashes in public copy. Use a colon, comma, full stop, or parentheses.",
  },
  {
    selector: "Literal[value=/\\u2014/]",
    message:
      "No em dashes in public copy. Use a colon, comma, full stop, or parentheses.",
  },
  {
    selector: "TemplateElement[value.raw=/\\u2014/]",
    message:
      "No em dashes in public copy. Use a colon, comma, full stop, or parentheses.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@ishraqparfums/bespoke-engine",
              message:
                "Bespoke engine is API-only. Use @ishraqparfums/shared contracts and BFF routes.",
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...noEmDash],
    },
  },
  {
    files: [
      "app/admin/**",
      "components/admin/**",
      "lib/admin/**",
      "components/bespoke/**",
      "lib/bespoke/**",
      "app/(shop)/bespoke/**",
      "components/perfume-slider/**",
      "components/perfume-slider-v2/**",
      "lib/orders/admin-order-status.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
