/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^bcryptjs$': '<rootDir>/src/tests/mocks/bcryptjs.js',
  },
}
