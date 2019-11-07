module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*\\.spec\\.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}
