export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./tests'],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
}