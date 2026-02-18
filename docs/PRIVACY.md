# Firmis Scanner Privacy Policy

**Last Updated:** 2026-02-07

## Overview

Firmis Scanner is committed to protecting your privacy. This document explains what data the scanner collects, how it's used, and your choices regarding data sharing.

**Key Principles:**
1. The scanner works fully offline by default
2. All cloud features are opt-in
3. No personally identifiable information is collected
4. You control what data is shared

---

## Data Collection Summary

| Data Type | Collected | Opt-in | Sent to Cloud |
|-----------|-----------|--------|---------------|
| File paths | No | - | Never |
| Code snippets | No | - | Never |
| Environment variables | No | - | Never |
| IP address | No | - | Never |
| Threat pattern hashes | Yes | Telemetry | Anonymized |
| Platform statistics | Yes | Telemetry | Aggregated |
| Behavioral features | Yes | Cloud scan | Numeric only |

---

## Offline Mode (Default)

When you run `firmis scan` without the `--cloud` flag:

**What happens locally:**
- Scans your AI agent components
- Matches against bundled YAML rules
- Generates reports (JSON, SARIF, HTML, terminal)

**What is NOT collected or sent:**
- Absolutely nothing leaves your machine
- No network requests are made
- No telemetry is collected
- No usage tracking occurs

---

## Cloud Mode (Opt-in)

When you run `firmis scan --cloud`:

### Data Sent for Threat Enrichment

We send **threat pattern hashes** to enhance your results:

```typescript
// What we send
{
  "signatureHash": "sha256:abc123...",  // Hash of rule+pattern, NOT code
  "category": "credential-harvesting",   // Threat category
  "severity": "high",                    // Severity level
  "patternType": "file-access",          // Pattern type
  "platform": "claude",                  // Platform name
  "localConfidence": 85                  // Detection confidence
}
```

**What we DO NOT send:**
- File paths
- File names
- Code snippets
- Directory structure
- Environment variables
- User or machine identifiers

### Data Sent for Behavioral Analysis

We send **numeric feature vectors** for ML classification:

```typescript
// What we send
{
  "platform": "mcp",
  "componentType": "server",
  "features": {
    "apiCategories": {
      "filesystem": 12,    // Count only, no function names
      "network": 3,
      "process": 0,
      "crypto": 2,
      "environment": 5
    },
    "dataFlows": {
      "readsCredentialPaths": true,   // Boolean only
      "writesExternalUrls": true,
      "encodesData": true,
      "obfuscatesStrings": false
    },
    "codeMetrics": {
      "totalLines": 450,
      "functionCount": 23,
      "importCount": 15,
      "dynamicEvalCount": 0
    }
  }
}
```

**What we DO NOT send:**
- Actual code
- Function names
- Variable names
- String literals
- File contents

---

## Telemetry (Opt-in)

When you enable telemetry with `firmis scan --cloud --contribute`:

### Purpose

Telemetry helps us:
1. Identify new threats through collective intelligence
2. Reduce false positives based on community feedback
3. Track malware prevalence across the ecosystem

### What We Collect

```typescript
{
  "eventId": "random-uuid",              // Random ID
  "timestamp": "2024-03-15T10:30:00Z",
  "scannerVersion": "1.0.0",
  "installationId": "sha256:rotating",   // Rotates weekly

  // Aggregate counts only
  "platforms": [
    { "type": "claude", "componentCount": 47 }
  ],

  // Pattern hashes only
  "threats": [
    {
      "signatureHash": "sha256:...",
      "category": "credential-harvesting",
      "severity": "high",
      "confidence": 85
    }
  ]
}
```

### Installation ID

Your installation ID is:
- A SHA256 hash of non-identifying machine characteristics
- Rotated weekly (new hash every week)
- Not linkable to you personally
- Used only for deduplication

### Data Retention

- Raw telemetry: 7 days
- Aggregated statistics: 2 years
- No personally identifiable information retained

---

## Your Choices

### Disable All Cloud Features

Use the scanner completely offline:
```bash
firmis scan  # No cloud by default
```

### Enable Cloud Without Telemetry

Get threat intelligence without contributing:
```bash
firmis scan --cloud
```

Or in config:
```yaml
cloud:
  enabled: true
  telemetry:
    enabled: false
```

### Enable Everything

Contribute to collective defense:
```bash
firmis scan --cloud --contribute
```

### Request Data Deletion

Email privacy@firmis.cloud with your installation ID to request deletion of any telemetry data associated with your installation.

---

## Data Security

### Encryption

- All API communication uses TLS 1.3
- Threat signatures are encrypted at rest (AES-256)
- API keys are hashed and salted

### Access Control

- Role-based access to threat database
- All API access is logged
- Regular security audits

### Compliance

- GDPR compliant (EU)
- CCPA compliant (California)
- SOC 2 Type II certified (Enterprise tier)

---

## Third-Party Services

Firmis Cloud uses the following infrastructure:

| Service | Purpose | Data Processed |
|---------|---------|----------------|
| Cloudflare | API Gateway | Request routing (no logging) |
| Supabase | Database | Threat signatures, aggregates |
| ClickHouse Cloud | Analytics | Telemetry aggregates only |

No third party receives:
- Your code
- Your file paths
- Personally identifiable information

---

## Changes to This Policy

We will notify users of material changes via:
1. GitHub release notes
2. CLI warning message
3. Dashboard notification (for registered users)

---

## Contact

For privacy questions or concerns:
- Email: privacy@firmis.cloud
- GitHub: https://github.com/riteshkew/firmis-scanner/issues

---

## Summary

| Question | Answer |
|----------|--------|
| Does Firmis see my code? | No |
| Does Firmis know my file paths? | No |
| Does Firmis track my identity? | No |
| Can I use Firmis fully offline? | Yes |
| Is cloud opt-in? | Yes |
| Can I delete my data? | Yes |
