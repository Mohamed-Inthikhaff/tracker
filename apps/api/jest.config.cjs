/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  moduleNameMapper: {
    "^@expense-tracker/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@expense-tracker/utils$": "<rootDir>/../../packages/utils/src/index.ts",
  },
};
