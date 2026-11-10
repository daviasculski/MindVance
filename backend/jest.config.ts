import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.spec.ts"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.test.json" },
    ],
  },
  collectCoverageFrom: [
    "src/application/userstories/CreateIdeaUserStorie.ts",
    "src/application/userstories/SubmitEvaluationUserStory.ts",
    "src/application/userstories/CreateUserUserStory.ts",
    "src/application/userstories/MoveIdeaToNextStageUserStory.ts",
    "src/application/userstories/ListManualStageTransitionsUserStory.ts",
    "src/presentation/middlewares/ensureAuthenticated.ts",
    "src/presentation/middlewares/ensureRole.ts",
    "src/presentation/middlewares/ensureAdminRole.ts",
  ],
  // The enforced threshold covers the business and security modules exercised
  // directly by this suite, rather than implying whole-repository coverage.
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
