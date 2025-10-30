export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  roots: ['<rootDir>/app'],
  collectCoverageFrom: ['app/**/*.{ts,tsx}'],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80
    }
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: './tsconfig.json'
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
