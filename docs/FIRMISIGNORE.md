# .firmisignore File

The `.firmisignore` file allows you to suppress specific findings from the Firmis Scanner. This is useful for handling false positives, ignoring test files, or suppressing findings in vendor/third-party code.

## File Locations

The scanner will look for `.firmisignore` files in the following locations (in priority order):

1. **Project root** - `<project>/.firmisignore`
2. **Home directory** - `~/.firmis/.firmisignore`

## File Format

- Lines starting with `#` are comments
- Blank lines are ignored
- Three types of ignore rules:
  1. **Rule ID only** - Ignores a specific rule globally
  2. **File pattern only** - Ignores all findings in matching files
  3. **Rule:Pattern combo** - Ignores a specific rule in matching files only

## Examples

### Ignore by Rule ID

Suppress specific rules across all files:

```
# Ignore all credential exposure findings
cred-001
cred-002
cred-003

# Ignore specific suspicious patterns
sus-006
```

### Ignore by File Pattern

Suppress all findings in specific files or directories using glob patterns:

```
# Ignore all findings in documentation
**/docs/**
**/*.md
**/README.md

# Ignore test files
**/test/**
**/__tests__/**
**/*.test.ts
**/*.spec.ts

# Ignore examples and samples
**/examples/**
**/samples/**

# Ignore vendored code
**/node_modules/**
**/vendor/**
```

### Ignore by Rule:Pattern Combo

Suppress specific rules only in specific files:

```
# Allow crypto operations in wallet skills
sus-006:**/wallet-skills/**
sus-007:**/wallet-skills/**

# Allow test credentials in test files
cred-001:**/test/**
cred-002:**/test/**
cred-003:**/test/**
cred-004:**/test/**

# Allow example API keys in documentation
cred-001:**/docs/**
cred-002:**/examples/**

# Allow network calls in legitimate API integrations
exfil-001:**/api-integrations/**
sus-003:**/api-integrations/**
```

## Glob Pattern Syntax

| Pattern | Meaning | Example Matches |
|---------|---------|-----------------|
| `*` | Any characters except `/` | `*.js` matches `file.js` |
| `**` | Zero or more path segments | `**/test/**` matches `a/test/b`, `test/c` |
| `?` | Single character except `/` | `file?.js` matches `file1.js` |
| `/` | Absolute path (from project root) | `/src/main.js` only matches `src/main.js` at root |

## Common Use Cases

### False Positives in Legitimate Code

```
# Crypto operations in legitimate wallet/blockchain skills
sus-006:**/crypto/**
sus-007:**/blockchain/**

# File system operations in legitimate backup/sync skills
sus-005:**/backup/**
sus-008:**/sync/**
```

### Test and Development Files

```
# Test fixtures with mock credentials
cred-001:**/test/fixtures/**
cred-002:**/test/mocks/**

# Development environment files
cred-003:**/.env.example
cred-004:**/sample.config.js
```

### Documentation and Examples

```
# Example code in documentation
**/examples/**
**/docs/code-samples/**

# Tutorial files
**/tutorials/**
**/getting-started/**
```

## Complete Example

Here's a complete `.firmisignore` file for a typical project:

```
# ============================================================
# .firmisignore - Firmis Scanner Ignore Rules
# ============================================================

# Test Files
# ============================================================
# Ignore all findings in test directories
**/test/**
**/__tests__/**
**/*.test.ts
**/*.test.js
**/*.spec.ts
**/*.spec.js

# Allow mock credentials in test files
cred-001:**/test/**
cred-002:**/test/fixtures/**

# Documentation
# ============================================================
# Ignore example code in docs
**/docs/**
**/examples/**
**/*.md
**/README.md

# Allow example API keys in documentation
cred-001:**/docs/**
cred-002:**/examples/**

# Legitimate Patterns
# ============================================================
# Allow crypto operations in wallet-related skills
sus-006:**/wallet/**
sus-007:**/crypto/**
sus-006:**/blockchain/**

# Allow network calls in API integration skills
exfil-001:**/api-integrations/**
sus-003:**/webhooks/**

# Vendor Code
# ============================================================
# Ignore third-party dependencies
**/node_modules/**
**/vendor/**
**/third-party/**

# Development Files
# ============================================================
# Ignore environment file examples
.env.example
.env.sample
**/config.example.js
**/config.sample.js
```

## Best Practices

1. **Be Specific** - Use rule:pattern combos instead of ignoring rules globally when possible
2. **Document Why** - Add comments explaining why each rule is ignored
3. **Review Regularly** - Periodically review your `.firmisignore` to ensure it's still needed
4. **Version Control** - Check `.firmisignore` into version control so the whole team benefits
5. **Don't Over-Suppress** - Avoid ignoring entire rule categories unless absolutely necessary

## Verification

To verify your `.firmisignore` file is working:

1. Run a scan without the file and note the threat count
2. Add your `.firmisignore` file
3. Run the scan again - you should see fewer threats
4. Check that the suppressed findings are gone from the output

## Limitations

- The `.firmisignore` file is loaded once at scan initialization
- Changes to `.firmisignore` require restarting the scan
- Patterns are matched against file paths relative to the project root
- Invalid glob patterns are silently skipped
