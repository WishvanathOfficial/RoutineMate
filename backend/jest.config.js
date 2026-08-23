/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/models/**',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  verbose: true,
};
