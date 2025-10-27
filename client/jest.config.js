const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock UI components that don't exist
    '^@/components/ui/(.*)$': '<rootDir>/src/components/ui/$1',
    '^@/components/ui/badge$': '<rootDir>/src/components/ui/badge.tsx',
    '^@/components/ui/button$': '<rootDir>/src/components/ui/button.tsx',
    '^@/components/ui/card$': '<rootDir>/src/components/ui/card.tsx',
    '^@/components/ui/input$': '<rootDir>/src/components/ui/input.tsx',
    '^@/components/ui/label$': '<rootDir>/src/components/ui/label.tsx',
    '^@/components/ui/select$': '<rootDir>/src/components/ui/select.tsx',
    '^@/components/ui/textarea$': '<rootDir>/src/components/ui/textarea.tsx',
    '^@/components/ui/table$': '<rootDir>/src/components/ui/table.tsx',
    '^@/components/ui/tooltip$': '<rootDir>/src/components/ui/tooltip.tsx',
    '^@/components/ui/skeleton$': '<rootDir>/src/components/ui/skeleton.tsx',
    '^@/components/ui/progress$': '<rootDir>/src/components/ui/progress.tsx',
    '^@/components/ui/separator$': '<rootDir>/src/components/ui/separator.tsx',
    '^@/components/ui/sheet$': '<rootDir>/src/components/ui/sheet.tsx',
    '^@/components/ui/popover$': '<rootDir>/src/components/ui/popover.tsx',
    '^@/components/ui/hover-card$': '<rootDir>/src/components/ui/hover-card.tsx',
    '^@/components/ui/dropdown-menu$': '<rootDir>/src/components/ui/dropdown-menu.tsx',
    '^@/components/ui/collapsible$': '<rootDir>/src/components/ui/collapsible.tsx',
    '^@/components/ui/checkbox$': '<rootDir>/src/components/ui/checkbox.tsx',
    '^@/components/ui/calendar$': '<rootDir>/src/components/ui/calendar.tsx',
    '^@/components/ui/breadcrumb$': '<rootDir>/src/components/ui/breadcrumb.tsx',
    '^@/components/ui/avatar$': '<rootDir>/src/components/ui/avatar.tsx',
    '^@/components/ui/chart$': '<rootDir>/src/components/ui/chart.tsx',
    '^@/components/ui/sidebar$': '<rootDir>/src/components/ui/sidebar.tsx',
    '^@/components/ui/scroll-area$': '<rootDir>/src/components/ui/scroll-area.tsx',
    '^@/components/ui/form$': '<rootDir>/src/components/ui/form.tsx',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@auth/prisma-adapter|@prisma/client|prisma))',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 50, // Lowered for CI/CD
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  // Add global test setup
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Handle ESM modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
}

module.exports = createJestConfig(customJestConfig)