import ts from "typescript";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";

const root = resolve("src");
function filesAt(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory()
      ? filesAt(path)
      : /\.tsx?$/.test(path)
        ? [path]
        : [];
  });
}
const files = filesAt(root);
const graph = new Map();
const clients = [];
for (const file of files) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  if (
    source.statements.some(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression) &&
        statement.expression.text === "use client",
    )
  )
    clients.push(file);
  const edges = new Set();
  function add(specifier) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return;
    const base = specifier.startsWith("@/")
      ? resolve(root, specifier.slice(2))
      : resolve(dirname(file), specifier);
    const target = [
      base + ".ts",
      base + ".tsx",
      resolve(base, "index.ts"),
      resolve(base, "index.tsx"),
    ].find(existsSync);
    if (target) edges.add(target);
  }
  function inspect(node) {
    if (
      ts.isImportDeclaration(node) &&
      !node.importClause?.isTypeOnly &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      add(node.moduleSpecifier.text);
    if (
      ts.isExportDeclaration(node) &&
      !node.isTypeOnly &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      add(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      add(node.arguments[0].text);
    ts.forEachChild(node, inspect);
  }
  inspect(source);
  graph.set(file, [...edges]);
}
const failures = new Set();
const label = (file) => relative(root, file).replaceAll("\\", "/");
function visit(file, path, checked, check) {
  if (path.includes(file)) {
    failures.add(
      "Dependency cycle: " + [...path, file].map(label).join(" -> "),
    );
    return;
  }
  if (checked.has(file)) return;
  check(file);
  for (const next of graph.get(file) ?? [])
    visit(next, [...path, file], checked, check);
  checked.add(file);
}
for (const file of files) {
  if (label(file).startsWith("domain/"))
    visit(file, [], new Set(), (dependency) => {
      if (
        /^(services|components|hooks|app)\//.test(label(dependency)) ||
        label(dependency) === "config/env.ts"
      )
        failures.add(
          `Domain depends on infrastructure: ${label(file)} -> ${label(dependency)}`,
        );
    });
}
for (const file of clients)
  visit(file, [], new Set(), (dependency) => {
    if (
      /^services\//.test(label(dependency)) ||
      label(dependency) === "config/env.ts" ||
      /^app\/api\//.test(label(dependency))
    )
      failures.add(
        `Client reaches server code: ${label(file)} -> ${label(dependency)}`,
      );
  });
const checked = new Set();
for (const file of files) visit(file, [], checked, () => {});
console.log(
  JSON.stringify(
    {
      sourceModules: files.length,
      clientRoots: clients.length,
      violations: [...failures],
    },
    null,
    2,
  ),
);
if (failures.size) process.exitCode = 1;
