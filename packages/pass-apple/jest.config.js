export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
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
