/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  env: {
    es2022: true,
    node: true
  },
  ignorePatterns: ["dist", "node_modules", ".next", "coverage"]
};
