import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "artifacts/**",
      "next-env.d.ts",
    ],
  },
];
