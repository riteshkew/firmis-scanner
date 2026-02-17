# Firmis Marketing Positioning Document

**Last Updated:** 2026-02-17
**Version:** 3.0 (agentic security category, single persona, education-first)

---

## 1. Brand Positioning Statement

For developers building and deploying AI agents, Firmis is the security layer that tells you — and your clients — that your agent stack is secure. One command. 30 seconds. Plain English results. From scanning to pentesting to runtime monitoring, Firmis is fire-and-forget agentic security.

---

## 2. Target Personas

### The Agent Builder (primary persona)

- **Who:** Developer, 22-40, building with OpenClaw/Claude/Cursor/CrewAI/MCP servers
- **Technical level:** Uses AI agents daily, may or may not have security background
- **Stack:** OpenClaw + MCP servers + Claude Code, ships fast, sometimes deploys for clients
- **Two modes of pain:**
  - **Personal (outer ring):** Installs skills from ClawHub without reading code. Heard about malicious skills. Doesn't know how to check.
  - **Professional (inner ring):** Deployed an agent solution for a client. Client asked "how do you protect our data from your AI tools?" Had no answer.
- **Trigger moments:** HN article about malicious skills (outer ring) / client security questionnaire (inner ring)
- **Objections:** "Is this going to slow me down?" / "I don't have time for security" / "Enterprise tools are overkill"
- **Messaging:**
  - Outer ring: "One command. Know if your agents are secure."
  - Inner ring: "Prove your agents are secure."
- **Conversion path:** `npx firmis scan` (free) → findings → email-gated basic report → client asks for proof → paid compliance report + monitoring

---

## 3. Messaging Framework

### Hero Headlines (A/B test candidates)

1. **"Your AI agents have keys to everything. Who's watching them?"** (education)
2. **"The security layer for AI agents."** (category-defining)
3. **"One command. Every threat. 30 seconds."** (simplicity)
4. **"Prove your agents are secure."** (B2D2B)
5. **"Agentic security. Not another dashboard."** (category + anti-enterprise)

### Messaging Arc

| Phase | Message | Audience |
|---|---|---|
| Awareness (education) | "Here's what your MCP config actually exposes" | Outer ring |
| Adoption (relief) | "One command. You're safe. Back to building." | Outer ring |
| Conversion (proof) | "Share this report with your client" | Inner ring |
| Retention (empowerment) | "Ship fast, stay secure. Firmis has your back." | Both |
| Advocacy (identity) | "I run Firmis before every deployment." | Both |

### Value Propositions

| # | Value Prop | Supporting Claim | Proof Point |
|---|-----------|-----------------|-------------|
| 1 | **Instant visibility** | Know exactly what your AI agents can access in 30 seconds | `npx firmis scan` → terminal output with security grade |
| 2 | **Real threat detection** | Same detection patterns that found 341 malicious skills on ClawHub | 176+ detection rules, 8 platform analyzers, 14 threat categories |
| 3 | **Fix, don't just find** | Auto-remediation and continuous monitoring, not just another report | `firmis fix` patches issues, `firmis monitor` catches new ones in real-time |

### Pain Point Prioritization Matrix

| Pain Point | Frequency | Severity | Willingness to Pay | Priority |
|-----------|-----------|----------|-------------------|----------|
| "Clients ask about AI security, I have no answer" | Medium | High | High | **#1** |
| "I don't know if my AI agent skills are safe" | High | Critical | Medium | **#2** |
| "Enterprise security tools are too expensive/overkill" | High | Medium | High | **#3** |
| "I installed random skills from ClawHub" | Medium | Critical | Low (free scan) | **#4** |
| "No visibility into what agents access" | Medium | High | Medium | **#5** |
| "No way to prove compliance for AI agents" | Low | High | High | **#6** |

---

## 4. Landing Page Copy Blocks

### Section 1: Hero

**Badge:** `Early Beta — Free Scanner Available`

**Headline:** The security layer for AI agents.

**Subheadline:** One command scans your entire agent stack — OpenClaw skills, MCP servers, Claude configs — for malicious tools, exposed credentials, and data theft. Free. 30 seconds. Plain English.

**Primary CTA:**
```
$ npx firmis scan
```

**Secondary CTA:** Get notified when compliance reports launch → [email input] → Join Waitlist

**Three pills below CTA:**
- Scan (Free) — Find every threat in your agent stack
- Report (Free) — Security grade + findings for you and your clients
- Monitor + Fix (Paid) — Continuous runtime protection per deployment

### Section 2: The Problem (Education Section)

**Headline:** Your agents have access to everything. Here's what that means.

**Stat Grid (4 stats):**

| Stat | Label | Source |
|------|-------|--------|
| 540% | Surge in AI agent attacks (2025) | HackerOne 9th Annual Report |
| 341 | Malicious skills found on ClawHub | Koi Security "ClawHavoc" audit |
| 7.1% | Of agent skills are malicious | Firmis scan of 4,812 ClawHub skills |
| 97% | Of developers don't audit agent permissions | Snyk State of AI Security |

**Access Points Grid (what agents can reach):**
- AWS credentials (`~/.aws/credentials`)
- SSH private keys (`~/.ssh/id_rsa`)
- Browser passwords (Chrome Login Data)
- Git credentials (`~/.git-credentials`)
- Environment variables (API keys, tokens)
- Database connections (connection strings)

**Body:** Every AI agent you deploy — every MCP server, every OpenClaw skill, every tool connection — gets access to files, credentials, and network. Most developers never audit these permissions. Our research found that 7.1% of marketplace skills are actively malicious. Here's what Firmis finds when it scans a typical agent setup.

### Section 3: How Firmis Works

**Headline:** Three layers of protection. One command to start.

**Step 1 — Scan (Free)**
- `npx firmis scan` — works in 30 seconds, no signup
- Scans 8 agent environments: OpenClaw, MCP, Claude, CrewAI, Cursor, AutoGPT, Codex, Nanobot
- 176+ detection rules across 14 threat categories
- Security grade (A through F) with plain-English findings

**Step 2 — Report (Free basic / Paid compliance)**
- Free: Security grade A-F, findings in plain English, email-gated
- Paid: Compliance gap analysis (SOC2, AI Act, GDPR), branded client-shareable PDF, AI-powered fix prompts

**Step 3 — Monitor + Fix (Paid, per deployment)**
- `firmis monitor` — continuous runtime protection
- `firmis fix` — auto-remediation
- Real-time alerts: blocks credential exfiltration, detects prompt injection, prevents unauthorized network calls
- Slack/email notifications for new threats

### Section 4: What We Scan

**Headline:** Every environment where your agents run.

We scan every environment where AI agents are configured and deployed — from dedicated agent harnesses to agent-capable IDEs.

| Agent Environment | What We Scan | Threats Detected |
|---|---|---|
| OpenClaw | SKILL.md permissions, installed skills, ClawHub blocklist | Malicious skills, over-granted permissions, known bad actors |
| MCP Protocol | mcp.json/claude_desktop_config.json, server topology | Credential exposure, tool shadowing, malicious servers |
| Claude | Skills, MCP client configs, file access patterns | Prompt injection, credential harvesting, data exfiltration |
| CrewAI | Agent definitions, tool configs, Python source | Env var harvesting, C2 communication, malware distribution |
| Cursor | .cursor/rules, agent mode configs | Permission over-grants, credential exposure |
| AutoGPT | Plugin configs, workspace permissions | File system abuse, network abuse |
| Codex | Tool definitions, sandbox configs | Privilege escalation, credential access |
| Nanobot | Agent configs, tool permissions | Over-granted access, data exfiltration |

### Section 5: Terminal Demo

**Headline:** See it in action

```
$ npx firmis scan

  Firmis Scanner v1.3.0
  Scanning AI agent stack...

  Platforms detected:
    ✓ OpenClaw (12 skills installed)
    ✓ MCP (5 servers configured)
    ✓ Claude Skills (3 active)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  CRITICAL  polymarket-traiding-bot (OpenClaw)
            Known malicious tool — stealing passwords from developers
            Author linked to 40+ malicious tools
            → Run: firmis fix --remove polymarket-traiding-bot

  HIGH      mcp.json (MCP Config)
            Your AWS password is visible to all 5 connected AI tools
            → Run: firmis fix --rotate-credential aws

  HIGH      data-pipeline (CrewAI)
            This tool is secretly sending your data to an unknown server
            → Run: firmis fix --remove-exfil data-pipeline

  MEDIUM    .cursor/rules (Cursor)
            3 passwords stored in plain text — anyone can read them
            → Run: firmis fix --secure-env .cursor

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Security Grade: D
  Threats: 4 critical · 7 high · 3 medium
  Components: 20 scanned · 6 failed

  → firmis report (get your full HTML report)
  → firmis fix (auto-remediate all findings)
```

### Section 6: Before / After Firmis

| Without Firmis | With Firmis |
|----------------|-------------|
| You have no idea if your AI tools are safe | Security grade A-F in 30 seconds |
| Passwords sitting in config files anyone can read | Every exposed password found and flagged |
| Malicious tools hiding in agent marketplaces | Known bad actors blocked before they run |
| Hours reading source code you don't understand | Plain English: "This tool is sending your files to an unknown server" |
| "How do you protect our data?" — no answer | Share a compliance report with your client |
| "I'll deal with security later" | One command. Done. Move on to building. |

### Section 7: FAQ

**Q: Wait — my AI tools can actually steal my stuff?**
A: Yes. Every AI agent you install — Cursor, Claude, MCP servers, OpenClaw skills — gets access to your files, passwords, and API keys. Most people never check what these tools actually do behind the scenes. Our research found that 7.1% of agent marketplace skills are actively malicious. Firmis shows you exactly what's in your stack before it becomes a problem.

**Q: Is the scan really free?**
A: Completely free. Run `npx firmis scan` in your terminal — no account, no credit card, no catch. You get a security grade (A through F) and a list of everything we found, in plain English. If you want a detailed report, we ask for your email.

**Q: I'm not a security expert. Will I understand the results?**
A: That's exactly who we built this for. Instead of cryptic error codes, you get messages like "This tool is reading your AWS passwords and sending them to an unknown server." Every finding comes with a plain-English explanation and what to do about it.

**Q: Will this slow down my AI tools?**
A: The scan takes about 30 seconds and runs completely offline — it reads your config files, it doesn't touch your running agents. The paid monitoring tier watches your agents in real-time with no noticeable delay.

**Q: Who built this?**
A: Security veterans who've been protecting enterprise companies since 2018. We saw that AI security tools were only available to big enterprises, so we built Firmis to give everyone the same protection for free.

**Q: What AI tools does Firmis check?**
A: We scan 8 agent environments: OpenClaw, MCP servers, Claude, CrewAI, Cursor, AutoGPT, Codex, and Nanobot. If you use any AI coding assistant or agent framework, we probably cover it.

**Q: Can I share the report with my clients?**
A: Yes. The compliance report is designed to be shared — it includes a security grade, detailed findings, and compliance gap analysis for SOC2, AI Act, and GDPR. It's the answer to "how do you protect our data from your AI tools?"

### Section 8: Final CTA

**Headline:** Find out in 30 seconds.

**Subheadline:** 1 in 14 AI tools is secretly stealing data. One command tells you if yours are safe.

**Primary CTA:** `$ npx firmis scan` (copy to clipboard)

**Secondary CTA:** Get notified when compliance reports launch → [email input] → Join Waitlist

---

## 5. Competitive Differentiation Matrix

### Direct Competitors

| Dimension | Firmis | SecureClaw (Adversa AI) | Snyk (Invariant) | Cisco mcp-scan | OpenClaw built-in | Lasso Gateway |
|-----------|--------|------------------------|-------------------|----------------|-------------------|---------------|
| **Target** | Prosumer / agent builders | OpenClaw developers | Enterprise | Security researchers | OpenClaw users | Enterprise |
| **Scope** | **8 agent environments** | OpenClaw only | MCP + OpenClaw | MCP only | OpenClaw only | MCP only |
| **Approach** | Scan + Pentest + Monitor + Fix + Compliance | Audit + Harden + Behavioral | Static scan | YARA + LLM analysis | Audit + VirusTotal | Runtime proxy |
| **Compliance** | **SOC2, AI Act, GDPR** | OWASP Agentic Top 10 | Enterprise only | No | No | No |
| **Client reports** | **Yes (branded PDF)** | No | Enterprise only | No | No | No |
| **Auto-fix** | Yes | Hardening modules (5) | No | No | No | No |
| **Pentesting** | Yes (promptfoo) | No | No | No | No | No |
| **Runtime monitoring** | Yes (MCP proxy) | Behavioral rules | Limited | No | No | Yes (proxy) |
| **Price** | Free + paid per deployment (TBD) | Free (OSS) | Enterprise pricing | Free (OSS) | Free (built-in) | Enterprise |

### Why We Win

**The only tool that scans your entire agent stack.** SecureClaw protects your OpenClaw. Cisco scans your MCP. We scan everything — OpenClaw AND MCP AND Claude AND CrewAI AND Cursor AND Codex AND AutoGPT AND Nanobot — in one command. This is the Wiz vs AWS Security Hub positioning: they went deep on one cloud, Wiz covered them all.

**vs SecureClaw:** OpenClaw-only. 51 checks for one platform. Firmis has 176+ rules across 8 platforms + secret detection + compliance mapping + pentesting. They harden OpenClaw. We secure your entire agent stack.

**vs OpenClaw built-in:** Platform vendor doing basic audit + VirusTotal hash scanning. VirusTotal themselves said "not a silver bullet" — prompt injection payloads evade it. We do deep static analysis, active pentesting, and runtime monitoring.

**vs Snyk:** Enterprise pricing, enterprise sales cycles. We own agentic security for prosumers.

**vs Cisco mcp-scan:** MCP-only. No remediation, no runtime, no compliance.

**vs Lasso:** Enterprise infrastructure. We're zero-config CLI.

**vs DIY:** 176+ rules + 60 secret patterns + YARA signatures + 50+ blocklist + 8 analyzers + compliance mapping. Years of expertise, one command.

**Unique to Firmis:**
- Multi-platform scanning (nobody else does this)
- Compliance gap mapping (SOC2, AI Act, GDPR)
- Client-facing branded reports (B2D2B model)
- Fire-and-forget all-in-one (scan + pentest + monitor + fix)

---

## 6. Content Strategy

### Blog Series: "Agentic Security"

1. **"The OpenClaw Crisis"** (published) — Threat intelligence: 341 malicious skills found
2. **"What We Found Scanning 4,812 Agent Skills"** (planned) — Original research with real scan data
3. **"The Agentic Security Maturity Model"** (planned) — Industry framework for auditor/CISO adoption
4. **"Tool Poisoning: The Attack Your Security Team Has Never Heard Of"** (planned) — MCP-specific education
5. **"Agentic Security and Compliance: What SOC2 Auditors Will Ask Next"** (planned) — Compliance angle

### Content Approach

- **Education-first:** Every post teaches something genuine. Let facts create urgency, not manufactured fear.
- **Original research:** Publish findings from real scan data — ClawHub analysis, MCP server topology, credential exposure rates.
- **Build-in-public:** Share development journey, architecture decisions, scan results. Show the work.
- **Goal:** Become the definitive voice on agentic security for developers.

### Launch Channels

**Hacker News:** Lead with original research ("We scanned 4,812 ClawHub skills — here's what we found"). Technical audience appreciates data-driven posts. Answer every technical question, link to GitHub.

**Reddit (r/LocalLLaMA, r/ClaudeAI, r/OpenClaw):** "I built a free scanner for AI agent security" — show, don't tell. Include terminal screenshot with redacted results.

**Product Hunt:** "Free AI agent security scanner — find out if your tools are safe in 30 seconds." Target top in Security category.

**Twitter/X:** Thread format: "I scanned my own AI agent setup and found [finding]. Here's what I learned." Build-in-public updates on scan results and architecture decisions.

### Social Proof (Pre-Revenue)

- **Scan count badge:** "12,847 AI setups scanned"
- **GitHub stars:** MIT-licensed scanner repo
- **Outcome stats:** "Found X exposed passwords this week" (aggregate anonymized)
- **Enterprise heritage:** "Built by security veterans · Protecting enterprise companies since 2018"

### SEO Keyword Targets

| Keyword | Ring | Search Volume (est.) | Difficulty | Priority |
|---------|------|---------------------|------------|----------|
| "is cursor safe to use" | Outer | 3,200/mo | Low | #1 |
| "are AI coding tools safe" | Outer | 2,800/mo | Low | #2 |
| "AI agent security scanner" | Both | 1,600/mo | Medium | #3 |
| "mcp server security" | Outer | 1,200/mo | Low | #4 |
| "openclaw security" | Both | est. 800/mo | Low | #5 |
| "agentic security" | Inner | est. 400/mo | Low | #6 |
| "AI agent compliance SOC2" | Inner | est. 300/mo | Low | #7 |
| "claude code security" | Outer | 600/mo | Low | #8 |
| "nanobot security" | Outer | est. 200/mo | Low | #9 |
| "MCP tool poisoning" | Both | est. 500/mo | Low | #10 |

---

## 7. Funnel Metrics & Targets

### Conversion Funnel

```
Education content (blog, build-in-public, research)
    → "is my agent stack safe?" awareness
    → npx firmis scan (free, no signup, 30 seconds)
    │ 30% install rate → 3,000 scans/month
    ▼
firmis report (email-gated, basic)
    │ 40% email capture → 1,200 emails/month
    ▼
Nurture (email drip: 3 emails over 2 weeks)
    │ 5% paid conversion → 60 new customers/month
    ▼
firmis monitor (paid per deployment, pricing TBD)
    │ 85% monthly retention
```

### Channel Targets (Monthly)

| Channel | Traffic | Scans | Emails | Paid |
|---------|---------|-------|--------|------|
| Organic/SEO | 3,000 | 900 | 360 | 18 |
| Hacker News | 2,000 | 600 | 240 | 12 |
| Reddit | 2,000 | 600 | 240 | 12 |
| Twitter/X | 1,500 | 450 | 180 | 9 |
| Product Hunt (launch month) | 5,000 | 1,500 | 600 | 30 |
| Referral/word-of-mouth | 1,500 | 450 | 180 | 9 |
| **Total** | **10,000** | **3,000** | **1,200** | **60** |

### Key Metrics to Track

**Leading indicators:**
- Weekly `npx firmis scan` runs (target: 750/week)
- GitHub stars (target: 500 in first month)
- Email capture rate (target: 40% of scanners)
- Time-to-first-scan (target: < 60 seconds from landing page visit)

**Lagging indicators:**
- Monthly paid conversions (target: 60/month by Month 3)
- Monthly churn rate (target: < 15%)
- Customer Acquisition Cost (target: < $20, aiming for viral/organic)

---

## 8. Acquisition Strategy

### Single Product, Single Funnel

Firmis has one product (`npx firmis scan`) and one funnel:

```
Education content (blog, build-in-public, research)
    → "is my agent stack safe?" awareness
    → npx firmis scan (free, no signup, 30 seconds)
    → Basic report (free, email-gated)
    → Client asks for proof of security
    → Compliance report (paid) + monitoring (paid per deployment)
```

### Distribution Channels

- **Build-in-public:** Share development journey, scan results, architecture decisions on Twitter/X, HN
- **Original research:** Publish agentic security findings (ClawHub scans, MCP analysis)
- **Community:** Engage in r/ClaudeAI, r/LocalLLaMA, OpenClaw community
- **Partnerships:** Agent harness vendors (OpenClaw, etc.) — complementary, not competitive
- **CI/CD integration:** GitHub Action for automated agent security scanning (M1+)

---

## Sources

- [Snyk Acquires Invariant Labs (June 2025)](https://snyk.io/news/snyk-acquires-invariant-labs/)
- [HackerOne 9th Annual Report — 540% Prompt Injection Surge](https://www.hackerone.com/report/hacker-powered-security)
- [Koi Security — 341 Malicious ClawHub Skills](https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found)
- [Snyk ToxicSkills — Malicious AI Agent Skills Campaign](https://snyk.io/articles/clawdhub-malicious-campaign-ai-agent-skills/)
- [VentureBeat — OpenClaw Security Risk CISO Guide](https://venturebeat.com/security/openclaw-agentic-ai-security-risk-ciso-guide/)
- [Black Duck — 45% of AI-Generated Code Has Vulnerabilities](https://www.blackduck.com/blog/vibe-coding-and-its-implications.html)
- [Cisco MCP Scanner (OSS)](https://github.com/cisco-ai-defense/mcp-scanner)
- [Lasso MCP Gateway](https://github.com/lasso-security/mcp-gateway)
- [Snyk agent-scan](https://github.com/snyk/agent-scan)
