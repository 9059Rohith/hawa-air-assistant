import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: { complexity: ["error", 15] },
  },
  {
    files: ["src/services/**/*.ts", "src/lib/**/*.ts"],
    rules: {
      complexity: ["error", 15],
      "max-depth": ["error", 3],
      "max-lines-per-function": [
        "error",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
    },
  },
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
