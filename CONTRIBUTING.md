# Contributing to Firmis Scanner

Thank you for your interest in contributing to Firmis Scanner! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful and constructive. We're all here to make AI agents safer.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/firmis-scanner.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# Build
npm run build
```

## Project Structure

```
src/
├── cli/           # Command-line interface
├── scanner/       # Core scanning engine
│   └── platforms/ # Platform-specific analyzers
├── rules/         # Rule engine and pattern matching
├── reporters/     # Output formatters
└── types/         # TypeScript type definitions

rules/             # Built-in YAML rule definitions
test/              # Test suites and fixtures
```

## Adding a New Platform

1. Create `src/scanner/platforms/{platform}.ts`
2. Extend `BasePlatformAnalyzer`
3. Implement `detect()`, `discover()`, `analyze()`, `getMetadata()`
4. Register in `src/scanner/platforms/index.ts`
5. Add tests in `test/unit/scanner/platforms/`

Example:

```typescript
import { BasePlatformAnalyzer } from './base.js'
import type { PlatformType, PlatformConfig } from '../../types/index.js'

export class MyPlatformAnalyzer extends BasePlatformAnalyzer {
  readonly type: PlatformType = 'custom'
  readonly name = 'My Platform'

  readonly config: PlatformConfig = {
    basePaths: ['~/.myplatform/'],
    filePatterns: ['**/*.js', '**/*.ts'],
    configFiles: ['config.json'],
  }

  async detect(): Promise<boolean> {
    // Check if platform exists
  }

  async discover(): Promise<DiscoveredComponent[]> {
    // Find all components
  }

  // ... implement other methods
}
```

## Adding New Rules

1. Add rules to appropriate file in `rules/` directory
2. Follow the existing YAML schema
3. Include meaningful `description` and `remediation`
4. Set appropriate `confidenceThreshold`

Example:

```yaml
rules:
  - id: my-001
    name: Descriptive Name
    description: What this rule detects
    category: credential-harvesting
    severity: high
    version: "1.0.0"
    enabled: true
    confidenceThreshold: 80

    patterns:
      - type: regex
        pattern: "your-pattern"
        weight: 100
        description: What this pattern matches

    remediation: |
      How to fix the issue.
```

## Testing

- Write tests for all new functionality
- Maintain >80% code coverage
- Use meaningful test descriptions
- Include both positive and negative test cases

```typescript
describe('MyFeature', () => {
  it('detects malicious pattern', async () => {
    // Test implementation
  })

  it('ignores safe code', async () => {
    // Test implementation
  })
})
```

## Commit Messages

Follow conventional commits:

```
feat: add new platform analyzer for XYZ
fix: correct false positive in credential detection
docs: update README with new examples
test: add integration tests for MCP scanning
refactor: simplify rule matching logic
```

## Pull Requests

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md if applicable
5. Request review from maintainers

## Code Style

- TypeScript strict mode
- No `any` types
- Explicit return types for exported functions
- Use ESM imports with `.js` extension
- Max 50 lines per function
- Max 300 lines per file

## Questions?

- Open an issue for bugs or feature requests
- Discussions for general questions
- security@firmislabs.com for security issues

Thank you for contributing!
