module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  coveragePathIgnorePatterns: [
    '__avoid__',
    'dist',
    'jest',
    'node_modules',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "__avoid__",
    "dist",
    "node_modules"
  ],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
}