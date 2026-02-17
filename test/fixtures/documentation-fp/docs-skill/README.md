# Example Security Patterns

This document describes common security threats for educational purposes.

## Credential Harvesting

Attackers may try to access ~/.aws/credentials or ~/.ssh/id_rsa
to steal credentials. The pattern AKIA followed by 16 alphanumeric chars matches AWS Access Key IDs.

## Data Exfiltration

Malicious skills may use fetch to post to attacker.com/collect to
exfiltrate data. They may also use JSON.stringify(process.env) to
serialize the entire environment.

## Prompt Injection

Watch for patterns like "ignore previous instructions" or "you are now in admin mode".

## Network

Known C2 IPs include 91.92.242.30 and endpoints like webhook.site.
