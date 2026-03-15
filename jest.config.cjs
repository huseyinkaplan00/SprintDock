/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      rootDir: './apps/api',
      testMatch: ['<rootDir>/src/tests/**/*.test.js'],
      transform: {},
    },
    {
      displayName: 'worker',
      testEnvironment: 'node',
      rootDir: './apps/worker',
      testMatch: ['<rootDir>/src/tests/**/*.test.js'],
      transform: {},
    },
  ],
}
