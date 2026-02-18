# Firmis Go-To-Market Strategy Review

**Reviewer:** VP Marketing (ex-Snyk, ex-Datadog, ex-Semgrep perspective)
**Date:** 2026-02-17
**Documents Reviewed:** UNIFIED-PLAN-v5.md, MARKETING.md, README.md, PRIVACY.md
**Status:** Strategic GTM Plan with Actionable Recommendations

---

## Executive Summary

Firmis has a genuinely differentiated product thesis: multi-platform AI agent security for the prosumer/SMB tier that enterprise tools are ignoring. The "immune system" architecture is technically sound, but the GTM plan has several gaps that will cost you adoption if not fixed before launch. The biggest risks: (1) the email gate on reports will kill your viral loop before it starts, (2) you are trying to serve three personas simultaneously with three scanners, which will dilute your launch energy, and (3) your competitive positioning relies on feature matrices that your target users will never read.

This review provides specific, prioritized recommendations for each GTM dimension. Every recommendation follows a "do this, because X" format.

---

## 1. ICP & IUP Analysis

### Validating the Three Personas

**Vince (Vibe Coder) -- STRONG.** This is your best persona. The OpenClaw/ClawHub malicious skills narrative is real, current, and emotional. Vince is the person who will discover you, try you, and tweet about you. He is the IUP.

**Sara (SMB Founder) -- WEAK at launch.** Sara does not search for security tools. She responds to compliance pressure from clients. The Website Security Scanner is a commodity space (hundreds of tools exist: SecurityHeaders.com, Qualys SSL Labs, ImmuniWeb, Pentest-Tools). You will not win SEO for "website security scanner free" -- that keyword is dominated by established tools with years of backlinks. Sara's real pain point is "how do I answer my client's AI security questionnaire," but you are sending her to a generic website scanner that has nothing to do with AI. This creates a messaging disconnect.

**Ian (Indie Hacker) -- MODERATE.** Ian is a real persona, but "Supabase security scanner" is a niche within a niche. The Supabase community is tight-knit and will discover you through Supabase-specific channels (r/Supabase, Supabase Discord, Supabase blog). Ian is a secondary acquisition channel, not a primary one.

### Refined ICP (Ideal Customer Profile)

| Attribute | Definition |
|-----------|-----------|
| **Company size** | 1-15 people (solo developer to small startup) |
| **Tech stack** | Uses at least one AI agent platform (Claude Code, MCP servers, OpenClaw, Cursor, CrewAI) AND a Supabase/cloud backend |
| **Revenue stage** | Pre-revenue to $2M ARR -- cannot justify $125+/mo for enterprise security |
| **Buying trigger** | (1) Security incident or near-miss with AI tools, (2) client/investor asks about AI governance, (3) reads HN/Reddit post about AI agent attacks |
| **Budget** | $0-50/mo for security tooling. Will pay if scared AND sees clear value |
| **Decision maker** | The developer IS the decision maker. No procurement. Credit card checkout |
| **Geography** | US, UK, Western Europe, India, Israel -- English-speaking dev communities |

### Refined IUP (Ideal User Profile)

The IUP is a **developer who installs MCP servers or AI agent skills without reading the source code**, knows this is risky, but has no way to check. They are:

- 22-40 years old
- Active on HN, Reddit, Twitter/X dev communities
- Use `npx` regularly (comfortable with CLI)
- Have heard about AI security risks but have never used a security tool
- Ship fast, think about security reactively (after a scare)

### ICP vs IUP Gap

The gap is small for Firmis, which is a major advantage. Unlike enterprise security where the CISO buys and developers use, in the prosumer market the developer both discovers AND pays. **Do not introduce enterprise-style friction (account creation, org setup, team management) in the free tier, because your buyer and user are the same person.**

The risk emerges at the $19/mo tier: the developer who pays is probably building a product for clients (Ian), and the person who needs to see the report might be a non-technical founder (Sara). **Build the HTML report to be shareable with non-technical stakeholders, because this is how individual developers justify the $19/mo to themselves -- they can show the report to their boss/client.**

### Missing Personas

**1. DevSecOps Lead at a 50-100 Person Startup (Let's call them "Dana")**
Dana manages security for a team that has adopted AI coding assistants (Cursor, Claude Code) across 10-20 developers. Dana needs: (a) a way to scan all developer workstations, (b) a central dashboard showing org-wide risk, (c) CI/CD integration that blocks risky AI tool configs. Dana will pay $49-99/mo. **Do not build for Dana at launch, but know she exists for M3+ when you add team features.**

**2. Agency CTO Managing Client Projects ("Alex")**
Alex runs a dev agency with 5-10 active client projects, each using different AI tool stacks. Alex needs to prove to each client that their AI tools are secure. Alex will pay per-project. **The cross-scanner funnel (scan client's Supabase + scan their AI tools + generate report) maps perfectly to Alex's workflow. Build the multi-project report in M1-M2.**

**3. Open Source Maintainer ("Mia")**
Mia maintains a popular MCP server or OpenClaw skill. She wants to run Firmis in CI to prove her tool is safe. **This is your supply-side viral loop. If MCP server authors run Firmis in their CI and display a "Scanned by Firmis" badge, every user of that server sees your brand. Prioritize this.**

### Recommendations

1. **Launch with Vince as the primary persona.** Do this because the AI agent security narrative is unique to Firmis and impossible to commoditize. Sara's website scanner can wait.
2. **Defer the Website Security Scanner to M2+.** Do this because it is a commodity market that will distract from your unique positioning. Sara's real problem is AI governance, not HTTP headers.
3. **Add the "Mia" persona (OSS maintainer) to your funnel.** Do this because supply-side adoption (MCP server authors using Firmis in CI) creates a viral loop that demand-side marketing cannot replicate.
4. **Create a "team report" feature in M1 that lets Ian share scan results with clients.** Do this because shareability is how individual developers justify paying.

---

## 2. Positioning & Messaging

### Critique of the "Immune System" Metaphor

**For HN/technical audiences: it works.** The biological mapping is intellectually satisfying to engineers. The 7-layer model gives you a defensible framework that no competitor can easily claim. Keep it for blog posts, conference talks, and technical documentation.

**For landing pages and first-touch marketing: it is too abstract.** Vince does not care about "innate immunity vs adaptive patrol." He cares about: "Am I safe? How do I check? How do I fix it?" The metaphor requires explanation, and you lose users during the explanation.

**For Sara/non-technical personas: it will confuse them.** "Immune system" implies your product is always running (like a biological immune system), but the free tier is a point-in-time scan. This creates a promise-delivery gap.

### Recommendation

Use the immune system as your **thought leadership narrative** (blog arc, conference talks, technical docs), but **do not use it on the landing page or in first-touch ads.** The landing page should be purely outcome-driven.

### The One-Liner That Converts

For HN/Reddit/Twitter, you need a one-liner that creates an immediate emotional response AND tells the user what to do. Here are ranked options:

1. **"npx firmis scan -- find out if your MCP servers are stealing your credentials"** -- Do this because it combines a concrete action with a specific fear. Works on HN and Reddit.
2. **"We scanned 4,812 AI agent skills. 7.1% were malicious. Check yours in 30 seconds."** -- Do this for the research-led launch post. Data + urgency + action.
3. **"Your AI coding assistant has access to ~/.aws/credentials. Are you sure it's not reading it?"** -- Do this for Twitter threads. Specific, visceral, checkable.

**Do NOT use:** "The Immune System for AI Agents." Do this because it requires the reader to already understand the problem before they can understand the solution. Lead with the problem, not the solution architecture.

### Positioning vs Competitors

| Competitor | Their Positioning | Firmis Counter-Position |
|-----------|-------------------|------------------------|
| **Snyk (post-Invariant)** | "Enterprise AI security platform" | "Security for the rest of us. Same threats, no enterprise tax." |
| **mcp-scan** | "Scan your MCP servers" | "mcp-scan checks MCP. Firmis checks your entire AI stack -- 9 platforms, 350+ rules, auto-fix." |
| **Lasso** | "Enterprise MCP gateway" | "Lasso requires infrastructure changes. Firmis is one command." |
| **promptfoo** | "LLM red-teaming" | "promptfoo tests your LLM. Firmis protects your entire agent runtime." |
| **DIY** | N/A | "108 rules encoding what security teams have learned about AI agent attacks. You could build this -- or you could ship your product." |

### Fear-Based vs Trust-Based Messaging

| Persona | Best Approach | Why |
|---------|--------------|-----|
| **Vince** | Fear-first, then trust | Vince does not know he has a problem. Fear ("7.1% of skills are malicious") gets attention. Trust ("MIT-licensed, runs offline, no data sent") gets him to actually run the command. |
| **Ian** | Trust-first, then fear | Ian is a sophisticated developer who is skeptical of fear marketing. Lead with: "MIT-licensed. 350+ rules. Runs in CI. Here's what it catches." Then show specific examples. |
| **Sara** | Fear-first, social proof | Sara responds to business risk. "Your client just asked about AI governance. Here's how to answer." Followed by: "12,000+ scans run this month." |

### Defensible vs Aspirational Claims at Launch

| Claim | Status | Recommendation |
|-------|--------|----------------|
| "9 platform analyzers" | **Defensible** -- shipped in v1.1.0 | Use this everywhere. No competitor has this breadth. |
| "108+ detection rules" | **Defensible** -- shipped | Use it, but "350+" is aspirational until M0 ships secrets + YARA rules. |
| "7.1% of skills are malicious" | **Defensible IF you publish methodology** | Publish the full scan methodology alongside the stat. HN will tear apart unsubstantiated claims. |
| "Auto-fix" | **Aspirational** -- not built until M2 | Do not mention on the landing page until it ships. Show it on the roadmap page only. |
| "Runtime monitoring" | **Aspirational** -- not built until M3 | Same as above. Do not sell futures to developers -- they will call you out. |
| "30 seconds to scan" | **Defensible** -- actual perf is ~15s | Use this. It is conservative and verifiable. |
| "Zero config" | **Defensible** -- `npx firmis scan` works | This is your strongest claim against enterprise tools. Lead with it. |
| "Known-malicious blocklist (50+ skills)" | **Defensible** -- shipped | Use this. It is concrete and verifiable. |

### Recommendations

1. **Lead every piece of content with the problem, not the solution.** Do this because developers click on problems ("your MCP server can read your SSH keys") not solutions ("immune system for AI agents").
2. **Never mention unshipped features on the landing page.** Do this because developer trust is binary -- one broken promise and they leave forever. Show a roadmap page separately.
3. **Publish a detailed methodology for the 7.1% claim.** Do this because HN and Reddit will fact-check you, and surviving that scrutiny is worth more than any ad spend.

---

## 3. Content Strategy & SEO

### The 5-Part Blog Arc -- Review

The current blog arc is:

1. "Your AI Agents Have No Immune System"
2. "We Scanned 4,812 AI Agent Skills -- Here's What We Found"
3. "Tool Poisoning: The Attack Your Security Team Has Never Heard Of"
4. "The Inflammatory Response: Auto-Fixing AI Security"
5. "Herd Immunity for AI Agents: Community Threat Intelligence"

**What is right:** Posts 2 and 3 are strong. Post 2 is your launch post -- original research gets earned media. Post 3 is a HN frontpage candidate because it teaches something new.

**What is wrong:**
- Post 1 leads with the metaphor instead of the problem. Rename to: **"Your AI Coding Assistant Has Access to Everything on Your Machine. Here's Proof."** Do this because the problem statement is more clickable than the solution framework.
- Post 4 cannot be published until `firmis fix` ships. **Do not publish aspirational content about unbuilt features.** Do this because developers will try it, find it does not exist, and write a negative HN comment.
- Post 5 is M4 content. Same problem.

### Recommended Blog Arc (Revised)

1. **"Your AI Coding Assistant Can Read Your AWS Keys. Here's Proof."** (awareness, shareable, Vince-targeted)
2. **"We Scanned 4,812 AI Agent Skills. 7.1% Were Malicious."** (LAUNCH POST -- original research, earned media)
3. **"Tool Poisoning: The MCP Attack That Works 84% of the Time"** (technical deep-dive, HN frontpage candidate)
4. **"The Complete Guide to Securing Your MCP Server Configuration"** (SEO play, evergreen, how-to)
5. **"What We Learned Building an Open-Source AI Security Scanner"** (founder story, community building)

Post 4 and 5 are publishable with what exists today. Posts about auto-fix and community threat intel should wait until those features ship.

### SEO Keyword Clusters

**Cluster 1: AI Agent Security (Primary -- Vince)**

| Keyword | Monthly Volume (est.) | Difficulty | Content Type |
|---------|----------------------|-----------|-------------|
| "is cursor safe to use" | 3,200 | Low | Blog post + landing page |
| "are AI coding tools safe" | 2,800 | Low | Blog post |
| "mcp server security" | 1,200 | Low | Technical guide |
| "claude code security" | 600 | Low | Blog post |
| "AI agent security scanner" | 1,600 | Medium | Landing page (primary) |
| "mcp tool poisoning" | 400 | Very Low | Blog post (Post 3) |
| "openclaw malicious skills" | 800 | Low | Blog post (Post 2) |
| "AI agent permissions" | 500 | Low | Technical guide |

**Cluster 2: Supabase Security (Secondary -- Ian)**

| Keyword | Monthly Volume (est.) | Difficulty | Content Type |
|---------|----------------------|-----------|-------------|
| "supabase security check" | 2,400 | Low | Web tool landing page |
| "supabase rls check" | 800 | Low | Blog post + tool |
| "supabase row level security" | 1,800 | Medium | Technical guide |
| "supabase security best practices" | 1,200 | Medium | Blog post |
| "supabase exposed service key" | 300 | Very Low | Blog post |

**Cluster 3: Website Security (DEFER -- Sara)**

Do not invest in this cluster at launch. The competition is too strong ("website security scanner free" is dominated by Qualys, SecurityHeaders.com, ImmuniWeb) and it dilutes your AI-first positioning. Revisit when the AI governance angle is more developed.

### Original Research Opportunities

**1. "The State of AI Agent Security" Report**
- Scan every public MCP server on npm (there are now hundreds)
- Scan every OpenClaw skill on ClawHub
- Publish: percentage with exposed credentials, percentage with exfiltration patterns, percentage with known-malicious indicators
- **Do this because original research is the single highest-ROI content investment.** At Snyk, the "State of Open Source Security" report drove more pipeline than any other content asset. At Datadog, the infrastructure reports drove enormous earned media.
- Target: 10+ media pickups, HN frontpage, 500+ Twitter reposts

**2. "MCP Server Permission Audit"**
- Scan the top 50 most-installed MCP servers
- Document what file system paths, environment variables, and network endpoints each one accesses
- Publish a "trust scorecard" for popular MCP servers
- **Do this because it creates a reference asset that MCP server authors will link to** (either to show their good score or to fix their bad score).

**3. Monthly Threat Intelligence Digest**
- Publish a monthly "AI Agent Threat Report" with new malicious skills found, new attack patterns, scan statistics
- **Do this because it creates a recurring content cadence and positions Firmis as the authority on AI agent security.**

### Thought Leadership Strategy

**Where to publish:**

| Platform | Content Type | Frequency | Why |
|----------|-------------|-----------|-----|
| firmislabs.com/blog | Original research, technical guides | 2x/month | SEO ownership, full control |
| Hacker News | Original research, Show HN | 1x/month | Highest-value developer audience. Submit your research posts, not product announcements |
| Dev.to | Technical how-to guides | 2x/month | SEO juice, developer audience, cross-post from blog |
| Twitter/X | Threads, findings, demos | 3-5x/week | Community building, real-time engagement |
| YouTube | Terminal demos, "I scanned X" series | 2x/month | Visual proof, embeddable |

### Developer Conference Talks

**Tier 1 (Apply Now for 2026-2027):**

| Conference | Topic | Why |
|-----------|-------|-----|
| **DEF CON / Black Hat** | "Tool Poisoning: Red-Teaming MCP Servers" | Security credibility. AI Village talk would be ideal. |
| **OWASP Global AppSec** | "OWASP Top 10 for AI Agents" | OWASP alignment gives institutional credibility |
| **NeurIPS / ICML (workshop)** | "Adversarial Attacks on AI Agent Tool Interfaces" | Academic credibility for the research angle |

**Tier 2 (Accessible, High ROI):**

| Conference | Topic | Why |
|-----------|-------|-----|
| **BSides (any city)** | "I Scanned 4,812 AI Skills and Found 341 Malicious Ones" | BSides accepts new speakers. Great for practice and local community |
| **Supabase Launch Week** | "Securing Supabase Projects with Automated RLS Scanning" | Direct access to Ian persona. Supabase actively promotes community tools |
| **Vercel Ship / Next.js Conf** | "AI Agent Security for Full-Stack Developers" | Audience overlap with Vince and Ian |
| **AI Engineer Summit** | "Building Defense-in-Depth for AI Agent Stacks" | Practitioners building with agents |

**Tier 3 (Meetups -- Do These First):**

| Format | Topic | Why |
|--------|-------|-----|
| Local security meetups | Live demo of Firmis scanning an intentionally vulnerable MCP setup | Practice the talk, get feedback, build local community |
| AI/ML meetups | "The Security Risks Nobody Talks About in AI Agents" | Educate the audience, plant the seed |

### Recommendations

1. **Publish the "State of AI Agent Security" report as your launch post.** Do this because original research generates 5-10x more earned media than product announcements.
2. **Write the "is Cursor safe to use" blog post immediately.** Do this because it is the highest-volume, lowest-difficulty keyword in your cluster, and nobody has written a definitive answer.
3. **Apply to BSides and Supabase Launch Week within 30 days.** Do this because conference talks convert at higher rates than any other content format for developer tools.
4. **Create a monthly "AI Agent Threat Digest" newsletter.** Do this because recurring content builds audience ownership that is platform-independent.

---

## 4. Launch Strategy

### Phase 1: Pre-Launch (Weeks 1-4 Before Launch)

**Goal:** Build a waitlist of 500+ emails and a GitHub repo with 100+ stars before the public launch.

| Week | Action | Target | Why |
|------|--------|--------|-----|
| W-4 | Publish "Your AI Coding Assistant Can Read Your AWS Keys" blog post | 5,000 views | Awareness. Establishes the problem without selling the product. |
| W-3 | Ship the tool to 20 hand-picked beta testers (DM developers who tweeted about AI security concerns) | 20 testers, 10 detailed feedback reports | Validate messaging, find bugs, collect testimonials |
| W-2 | Open the GitHub repo (MIT license). Announce on Twitter: "We're building an open-source AI agent security scanner. Stars appreciated." | 100 stars | Social proof before launch |
| W-1 | Publish teaser thread on Twitter: "We scanned 4,812 AI agent skills. The results are terrifying. Full report drops next week." | 500 waitlist emails | Build anticipation. The teaser must include one specific, shocking finding to drive signups. |

**Pre-Launch Checklist:**
- [ ] GitHub repo is clean: good README, LICENSE, CONTRIBUTING.md, issue templates
- [ ] npm package works flawlessly via `npx firmis scan` -- test on 5 different machines
- [ ] Landing page at firmislabs.com with email capture
- [ ] 3 testimonials from beta testers ready to quote
- [ ] Terminal demo GIF recorded (high quality, <30 seconds)
- [ ] "State of AI Agent Security" research post drafted and reviewed

### Phase 2: Launch Day (and Launch Week)

**Launch Sequence (stagger across the week for maximum exposure):**

| Day | Channel | Content | Why This Order |
|-----|---------|---------|----------------|
| Monday | **Hacker News** | "Show HN: Firmis -- Open-source security scanner for AI agents (MCP, Claude, OpenClaw, 9 platforms)" | HN is the highest-signal channel. Monday morning EST gets maximum visibility. |
| Monday | **Twitter/X** | Research thread: "We scanned 4,812 AI agent skills. 7.1% were malicious. Here's what we found." (10-tweet thread with screenshots) | Amplify the HN post. Tag relevant accounts. |
| Tuesday | **Reddit** | Post to r/netsec: "Original research: We scanned 4,812 ClawHub skills and found 341 malicious ones" | r/netsec values research. Do not post to r/netsec on the same day as HN -- they will see through it. |
| Wednesday | **Reddit** | Post to r/ClaudeAI + r/LocalLLaMA: "I built a free security scanner for AI agents -- here's what it found on my machine" | Different audience, different angle (personal story, not research) |
| Thursday | **Dev.to** | Full technical blog post: "Building an Open-Source AI Agent Security Scanner" | Dev.to audience likes behind-the-scenes technical content |
| Friday | **Product Hunt** | Launch on Product Hunt | Friday launches get less competition. Use the week's momentum (HN comments, Reddit feedback, Twitter engagement) as social proof. |

**Launch Week Rules:**
- **Respond to every single HN comment within 1 hour.** Do this because the founder's engagement in HN comments is the primary conversion driver for developer tools. I have seen tools go from 0 to #1 based on comment quality alone.
- **Do NOT launch all three scanners at once.** Launch the AI Agent Scanner only. Do this because one clear message ("scan your AI agent stack") converts better than three. The Supabase and Website scanners should launch as separate "Show HN" moments 4-8 weeks later.
- **Have the GitHub repo ready for a traffic spike.** Do this because HN frontpage = 10,000-50,000 visitors in 24 hours. If the README is confusing or `npx firmis scan` fails, you will not get a second chance.

### Phase 3: Post-Launch (Weeks 1-8 After Launch)

| Week | Action | Target |
|------|--------|--------|
| W+1 | Publish detailed write-up of launch results: "What we learned launching an AI security tool on HN" | Community building |
| W+2 | Email all captured leads with a personalized follow-up based on their scan results | 10% reply rate |
| W+3 | Launch Supabase Scanner as a separate "Show HN" moment | Capture Ian persona |
| W+4 | Start weekly "AI Agent Threat Digest" newsletter | 500 subscribers |
| W+5 | GitHub issue triage, community PRs, "good first issue" labels | 10 community contributors |
| W+6 | Apply Firmis CI to popular open-source MCP servers, submit PRs with security findings | Earned credibility |
| W+8 | Publish "Month 1: What We Found Scanning X Thousand AI Agent Setups" | Second wave of earned media |

### Community Strategy

**Use GitHub Discussions, not Discord or Slack.** Do this because:
- Your target user (developer) is already on GitHub
- GitHub Discussions are searchable by Google (SEO benefit)
- Discord/Slack creates a maintenance burden for a small team
- Discord communities die when the founder stops posting daily

**When to add Discord:** Only after you have 500+ GitHub stars AND 50+ active Discussion participants. Do this because Discord works for community nurturing but is terrible for discovery.

**What drives engagement:**
- Monthly "scan challenge": "Run Firmis on the top 10 MCP servers and share results"
- "Threat of the week" posts with detailed analysis
- Feature request voting in GitHub Discussions
- Recognition of community contributors in release notes

### Recommendations

1. **Launch HN on a Monday morning EST with the research post, not a product announcement.** Do this because "Show HN: data" outperforms "Show HN: product" by 3x in upvotes.
2. **Stagger scanner launches 4-8 weeks apart.** Do this because each launch is a separate PR opportunity and each one reactivates your audience.
3. **Use GitHub Discussions, not Discord.** Do this because it is searchable, lower-maintenance, and your users are already there.
4. **Respond to every HN comment within 1 hour on launch day.** Do this because founder engagement is the #1 predictor of a successful Show HN.

---

## 5. PLG Funnel Optimization

### Current Funnel Analysis

```
npx firmis scan (free, no signup)     <- GOOD: zero friction
    |
    v
firmis report (email-gated)           <- PROBLEM: too early
    |
    v
firmis pentest (free basic)           <- GOOD: expands value before payment
    |
    v
firmis fix + monitor (paid)           <- GOOD: clear upgrade trigger
```

### The Email Gate Problem

**The email gate on `firmis report` is the single biggest risk in your funnel.**

Here is why: your primary viral mechanic is a developer running `npx firmis scan`, seeing scary results, and sharing them with colleagues or on social media. The moment you gate the shareable artifact (HTML report) behind an email, you kill the viral loop.

**What happens in practice:**
1. Developer runs `npx firmis scan`
2. Gets terminal output with A-F grade and findings
3. Wants to share with their team or client
4. Runs `firmis report`
5. Gets asked for email
6. 60% abandon here (industry average for email gates in developer tools)
7. Of the 40% who enter email, most give a throwaway address
8. You captured a "lead" that will never convert

**The alternative that works better:**
1. Developer runs `npx firmis scan`
2. Gets terminal output with A-F grade and findings
3. Runs `firmis report` -- gets a full HTML report, NO email gate
4. Shares the report with team/client. Report has "Scanned by Firmis" branding and a CTA: "Scan your own project at firmislabs.com"
5. Team/client visits firmislabs.com, runs their own scan
6. VIRAL LOOP ACHIEVED
7. Email capture happens on the WEBSITE (firmislabs.com), not in the CLI

### Recommendation

**Remove the email gate from `firmis report`.** Do this because the report IS your viral mechanic. Every report shared is a marketing asset. Gate the report on the web scanners (firmislabs.com/supabase, firmislabs.com/website-scanner) where the user expects web-form friction, but not in the CLI where developers expect tools to just work.

**Capture emails through:**
- firmislabs.com landing page (waitlist for paid features)
- Web scanner email gate (firmislabs.com/supabase -- this is fine, web users expect forms)
- "Get notified about new threats" opt-in at the bottom of the HTML report (not a gate, an option)
- Monthly newsletter signup on the blog

### Activation Metric

The activation metric is the action that predicts conversion to paid. For Firmis, candidates:

| Candidate Metric | Why | Recommendation |
|-----------------|-----|----------------|
| Runs scan twice (on different days) | Shows habitual use | **Best leading indicator.** Track this. |
| Shares HTML report | Shows the tool provides value beyond the individual | Second best. Track report opens from unique IPs. |
| Runs scan in CI (GitHub Actions) | Shows integration into workflow | Strong signal for Ian persona. |
| Runs `firmis pentest` (free tier) | Shows interest in deeper security | Direct upgrade predictor. |

**Primary activation metric: Second scan on a different day.** Do this because a second scan means the developer integrated Firmis into their workflow, not just tried it once. Optimize everything to get users to scan a second time.

### "Aha Moment" by Persona

| Persona | Aha Moment | How to Accelerate It |
|---------|-----------|---------------------|
| **Vince** | "Wait, that skill I installed from ClawHub is KNOWN MALICIOUS?" | Show the blocklist match prominently. Use the skill name and author. Make it personal. |
| **Ian** | "My Supabase project has 3 tables without RLS and I never noticed" | Show the specific table names and the SQL to fix it. Make the fix copy-pasteable. |
| **Sara** | "I can send this report to my client and it looks professional" | The HTML report must look like it was produced by a $500/hr security consultant. Design matters. |

### Referral/Viral Mechanics

**1. "Scanned by Firmis" Badge (HIGH PRIORITY)**
- For GitHub repos: a badge that links to a live scan result page
- Format: `[![Firmis Security Score](https://firmislabs.com/badge/github-user/repo.svg)](https://firmislabs.com/scan/github-user/repo)`
- **Do this because badges are the #1 viral mechanic for developer tools.** Snyk's badge drove millions of impressions. Codecov's badge drove their entire top-of-funnel.
- Build this in M1 alongside `firmis ci`

**2. Shareable Report URLs**
- When a user generates an HTML report, offer to host it at `firmislabs.com/report/{hash}`
- The hosted report has Firmis branding and a "Scan your own project" CTA
- **Do this because shareable URLs are more viral than file attachments.** Every Slack message with a Firmis report link is a marketing impression.

**3. "I Scanned My AI Stack" Social Card**
- After a scan, offer a Twitter/LinkedIn-optimized card: "I just scanned my AI agent stack with Firmis. Security Grade: B. 2 issues found and fixed."
- **Do this because developers share their tool results when it makes them look responsible.**

### Recommendations

1. **Remove the email gate from `firmis report` in the CLI.** Do this because the report is your viral loop, not your lead magnet.
2. **Build the "Scanned by Firmis" GitHub badge in M1.** Do this because badges drove Snyk's entire top-of-funnel growth.
3. **Track "second scan on a different day" as your primary activation metric.** Do this because it predicts habitual use.
4. **Host shareable report URLs at firmislabs.com/report/{hash}.** Do this because every shared URL is a free marketing impression.

---

## 6. Channel Strategy

### Channel Ranking by Expected ROI (Bootstrapped Team)

| Rank | Channel | Expected ROI | Investment | Why |
|------|---------|-------------|-----------|-----|
| 1 | **Hacker News** | Very High | Time only (founder writes posts, answers comments) | Highest-quality developer audience. One frontpage post = 10,000-50,000 visits. Free. But you only get 2-3 shots, so make each post count. |
| 2 | **Twitter/X** | High | Time (3-5 posts/week) | Real-time engagement, community building, amplifies other channels. The AI security conversation is active and growing. |
| 3 | **GitHub (SEO + Community)** | High | Time (README, Discussions, issues) | GitHub stars are social proof. GitHub Discussions are Google-indexed. A good README converts at 10-20% to `npx install`. |
| 4 | **Reddit** | High | Time (genuine participation, not spam) | r/netsec for research, r/ClaudeAI for product, r/LocalLLaMA for AI, r/Supabase for Supabase scanner. Each subreddit is a separate launch opportunity. |
| 5 | **Product Hunt** | Medium-High | 1 day of concentrated effort | Good for initial burst. #1 in Security category is achievable. But the traffic spike is short-lived -- convert visitors to email/GitHub stars on the day. |
| 6 | **SEO/Blog** | High (but slow) | Ongoing (2 posts/month) | Compounds over time. The "is Cursor safe" cluster has no competition. In 6 months, organic will be your #1 channel. |
| 7 | **Dev.to / Hashnode** | Medium | Cross-post from blog | Free distribution. Dev.to has good Google indexing. Low effort if you are already writing for your blog. |
| 8 | **YouTube** | Medium (growing) | 2 videos/month | Terminal demo videos work well for developer tools. YouTube Shorts for quick "I found X" clips. |
| 9 | **LinkedIn** | Low-Medium | 2 posts/week | Good for Sara persona and enterprise expansion later. Not primary at launch. |
| 10 | **Newsletter** | High (for retention) | Weekly, 1 hour | Not an acquisition channel, but the best retention channel. Build from day 1. |
| 11 | **Partnerships** | Medium (timing-dependent) | Relationship building | Supabase partnership (they promote community tools). Anthropic/OpenAI are too big to care about you at launch. |
| 12 | **Paid ads** | Low (at launch) | Money you do not have | Do NOT spend on paid ads until you have proven organic conversion. Earliest: Month 6, and only on "is cursor safe to use" type keywords where you already rank organically. |

### Content Cadence (Realistic for a 1-3 Person Team)

| Content Type | Frequency | Owner | Time Investment |
|-------------|-----------|-------|----------------|
| Twitter/X posts | 5x/week | Founder | 30 min/day |
| Blog post | 2x/month | Founder | 4 hours each |
| Newsletter | 1x/week (digest) | Automated + editorial | 1 hour/week |
| YouTube | 2x/month | Founder | 3 hours each |
| Reddit engagement | 3x/week (comments, not posts) | Founder | 15 min/day |
| GitHub Discussions | Daily | Founder | 15 min/day |

**Total: ~15 hours/week on marketing.** This is realistic for a technical founder. If you cannot commit 15 hours/week to marketing, you will not reach 5,000 npm downloads/month.

### Newsletter Recommendation

**Yes, start a newsletter from day 1.** Format: "AI Agent Threat Weekly" -- a 5-minute read covering:

1. New threats discovered this week (from your scans + open-source intelligence)
2. One technical deep-dive (attack technique, defense pattern)
3. Tool update (what shipped this week in Firmis)
4. Community highlight (interesting GitHub Discussion, contributor PR)

**Do this because email is the only channel you own.** Twitter can throttle you. HN can flag you. Reddit can ban you. Your email list is yours.

### Supabase Partnership Strategy

Supabase actively promotes community tools. Their "Launch Week" events feature community projects. Their Discord has 200,000+ members.

**Action plan:**
1. Ship the Supabase scanner with full Splinter SQL integration
2. Write a blog post: "We Built an Open-Source Supabase Security Scanner"
3. Submit to Supabase's community tools directory
4. DM Supabase developer advocates on Twitter with a link to the scanner
5. Apply for a "Launch Week" community spotlight

**Do this because Supabase's distribution is worth 10x what you could build on your own for the Ian persona.**

### Recommendations

1. **Invest 15 hours/week in marketing from day 1.** Do this because developer tools do not sell themselves, no matter how good they are.
2. **Start the "AI Agent Threat Weekly" newsletter before launch.** Do this because email is the only channel you own.
3. **Pursue the Supabase partnership immediately after the Supabase scanner ships.** Do this because their distribution for the Ian persona is 10x what you can build independently.
4. **Do not spend money on paid ads until Month 6.** Do this because you need to prove organic conversion first, and you do not have the budget for the learning period.

---

## 7. Competitive Differentiation in Market

### vs Snyk (Post-Invariant Acquisition)

**Snyk's move:** Acquired Invariant Labs in June 2025. Pulling the technology upmarket into their enterprise platform. $25/user/month minimum, 5-user floor = $125/month floor.

**What this means for Firmis:** Snyk has VALIDATED the market. They spent acquisition dollars to enter AI agent security. This is good for Firmis -- it means the market is real. But Snyk will own enterprise.

**How to position:**
- Never attack Snyk directly. Do this because your users (Vince, Ian) have never heard of Snyk, and mentioning them elevates their brand in your audience's mind.
- Position as: "Enterprise security tools cost $125+/month and require a security team. Firmis is free, runs in 30 seconds, and explains everything in plain English."
- **The "why not just use Snyk?" objection handler:** "Snyk is designed for enterprises with dedicated security teams. If you have a CISO and a security budget, use Snyk. If you are a solo developer or a small team, Firmis gives you 80% of the protection for $0-19/month instead of $125+."

### vs Free Tools (mcp-scan, promptfoo)

**The risk:** A developer asks "why not just use mcp-scan? It's free."

**How to position:**
- Acknowledge the free tools. Do not be dismissive. "mcp-scan is a great tool for checking MCP servers. If MCP is all you use, try it."
- Then differentiate: "If you also use Claude Code, Cursor, OpenClaw, CrewAI, or any other AI agent platform, you need a scanner that covers your entire stack. Firmis scans 9 platforms with 350+ rules. mcp-scan scans 1."
- **The key differentiator is integration, not feature count.** Firmis combines scanning + reporting + remediation + monitoring into one tool. The free alternatives are point solutions that require manual assembly.

### What Is the Moat?

Moats in developer tools are notoriously hard to build. Here is an honest assessment:

| Potential Moat | Strength | Timeline |
|---------------|----------|----------|
| **Rule database (350+ rules, growing)** | Medium | Now. But rules can be copied. |
| **Multi-platform coverage (9 platforms)** | Medium-High | Now. Hard to replicate because each platform requires deep understanding. |
| **Known-malicious blocklist** | High (if you grow it) | M4. The blocklist becomes more valuable as more users contribute telemetry. Network effect. |
| **Community threat intelligence** | Very High (if achieved) | M4+. This is the real moat. If 10,000 developers run Firmis, the collective intelligence makes the tool better for everyone. Competitors cannot replicate a network. |
| **Brand as "the AI agent security tool"** | High (if you move fast) | Now through M2. First-mover advantage in the prosumer AI security space. |
| **"Scanned by Firmis" badges in open source** | High (if achieved) | M1+. Once 100 popular MCP servers display the badge, it becomes the standard. |

**The honest answer:** Your moat is shallow right now. Rules can be copied. Multi-platform support can be replicated. **Your real moat will be (a) community threat intelligence (M4) and (b) brand ownership of "AI agent security for developers."** Move fast to establish both.

### Recommendations

1. **Never mention competitors by name in customer-facing content.** Do this because your users do not know them, and naming them gives free brand awareness to competitors.
2. **Position against the CATEGORY (enterprise security tools), not specific competitors.** Do this because "too expensive, too complex, too slow" resonates more than feature comparison tables.
3. **Build the "Scanned by Firmis" badge as a moat-building mechanic.** Do this because once open-source MCP servers adopt it, it becomes the de facto standard.
4. **Race to build community threat intelligence (M4).** Do this because network effects are the only durable moat in security tooling.

---

## 8. Pricing Strategy Recommendations

### Note

All pricing is TBD, and I agree with the decision to defer pricing until the product is built. However, the pricing MODEL you choose will shape your architecture decisions today. Here are recommendations.

### Recommended Pricing Model: Project-Based Freemium

| Tier | Price | What You Get | Gate |
|------|-------|-------------|------|
| **Free (OSS)** | $0 forever | CLI scan, report, basic pentest (10 probes), SARIF/JSON output, unlimited projects | None |
| **Pro** | $19/month | Full pentest (50+ probes), auto-fix, runtime monitor (1 project), email/Slack alerts, hosted report URLs, badge | Credit card |
| **Team** | $49/month | Everything in Pro, 5 projects, team dashboard (when built), CI/CD integration with org-wide view | Credit card |
| **Enterprise** | Custom | Everything in Team, unlimited projects, SSO, dedicated support, SLA | Sales call |

**Why project-based, not seat-based:** Do this because your IUP is a solo developer. Seat-based pricing punishes growth (adding a teammate doubles the cost). Project-based pricing rewards growth (more projects = more value = willingness to upgrade).

**Why $19/month:** This is the "Netflix threshold" -- an amount that solo developers will pay without needing approval from anyone. It is below the mental barrier of $20/month. It is also below the Snyk floor of $125/month, which makes the comparison visceral.

### Where the Value Boundary Sits

The free tier must be useful enough to drive adoption and word-of-mouth. The paid tier must solve a pain that the free tier creates awareness of.

**Free tier creates awareness of:** "You have 14 security issues, including 3 critical ones."
**Paid tier solves:** "Here's how to fix all 14 issues automatically, and here's a runtime monitor that catches new ones."

**The critical boundary is between "finding" and "fixing."** Scanning is free. Fixing is paid. Monitoring is paid. This is the same model that worked for Snyk (scan free, fix paid) and Datadog (basic monitoring free, alerting paid).

### Comparable Pricing Reference

| Tool | Free Tier | Paid Tier | Model |
|------|----------|----------|-------|
| **Snyk** | 200 tests/month | $25/user/month (5 min) | Seat-based |
| **Semgrep** | Unlimited OSS rules | $40/user/month | Seat-based |
| **Datadog** | 5 hosts, 1 day retention | $15/host/month | Usage-based |
| **Vercel** | Hobby (1 project) | $20/month | Project-based |
| **Supabase** | Free tier (2 projects) | $25/month | Project-based |
| **Railway** | $5 credit/month | $5/month + usage | Usage-based |

**Firmis at $19/month is competitively positioned.** It is cheaper than every security tool and comparable to developer platform tools that developers already pay for.

### The Free Tier Boundary

**What MUST be free (drives adoption):**
- `firmis scan` with all rules and all platforms
- Terminal report (A-F grade, findings list)
- JSON and SARIF output (CI/CD integration)
- HTML report (no email gate)
- Basic pentest (10 probes)
- GitHub badge

**What should be paid (drives revenue):**
- Auto-fix (`firmis fix`)
- Full pentest (50+ probes, custom probes)
- Runtime monitor (`firmis monitor`)
- Hosted report URLs (shareable, branded)
- Scheduled/continuous scanning
- Email/Slack alerts
- Team features

### Recommendations

1. **Use project-based pricing, not seat-based.** Do this because your user is a solo developer and seat-based pricing punishes team growth.
2. **Set the Pro tier at $19/month.** Do this because it is below the "Netflix threshold" and 7x cheaper than Snyk.
3. **Keep the scan + report fully free with no gates.** Do this because the free tier is your viral loop.
4. **Gate auto-fix and runtime monitoring behind paid.** Do this because "find free, fix paid" is a proven model (Snyk, Semgrep, Datadog).

---

## 9. Metrics & KPIs

### Metrics by Funnel Stage

| Stage | Metric | Tool to Measure | Target (Launch) | Target (Month 3) | Target (Month 6) |
|-------|--------|----------------|-----------------|-------------------|-------------------|
| **Awareness** | Blog post views | Plausible/Fathom | 10,000 | 20,000/mo | 40,000/mo |
| **Awareness** | Twitter impressions | Twitter Analytics | 50,000 | 200,000/mo | 500,000/mo |
| **Awareness** | HN frontpage appearances | Manual tracking | 1 | 3 cumulative | 6 cumulative |
| **Acquisition** | npm weekly downloads | npm stats | 500/week | 1,000/week | 2,000/week |
| **Acquisition** | GitHub stars | GitHub | 200 | 500 | 1,000 |
| **Activation** | Second scan (different day) | CLI telemetry (opt-in) | 20% of first scanners | 25% | 30% |
| **Activation** | Report generated | CLI telemetry | 40% of scanners | 45% | 50% |
| **Retention** | Weekly active scanners (WAS) | CLI telemetry | 100 | 300 | 750 |
| **Revenue** | Paid subscribers | Stripe | 0 (pre-paid launch) | 50 | 200 |
| **Revenue** | MRR | Stripe | $0 | $950 | $3,800 |
| **Referral** | GitHub badges in the wild | GitHub search | 0 | 20 | 100 |
| **Referral** | Report shares (unique URLs) | Analytics | 0 | 200 | 1,000 |

### Leading Indicators (What to Watch Daily/Weekly)

**Daily:**
- npm downloads (are people finding us?)
- GitHub stars (are people approving?)
- Twitter mentions (is the conversation growing?)

**Weekly:**
- New emails captured (is the funnel working?)
- Second-scan rate (are people coming back?)
- GitHub issues opened (are people engaging deeply enough to report bugs?)

**Monthly:**
- Organic search traffic (is SEO working?)
- Email open rate (is the content valuable?)
- Paid conversion rate (is the product worth paying for?)

### Realistic npm Download Targets

For context, here are npm download benchmarks for security CLI tools:

| Tool | Weekly Downloads (approx.) | Context |
|------|---------------------------|---------|
| eslint | 40,000,000 | Category leader, everyone uses it |
| semgrep | 50,000 | Established security tool |
| snyk | 200,000 | Enterprise security, well-funded |
| mcp-scan (estimated) | 1,000-5,000 | New, niche |
| trivy (aquasec) | 10,000 | Container security |

**Firmis realistic targets:**
- Launch week: 1,000-3,000 downloads (HN spike)
- Month 1: 500-1,000/week (settling after launch)
- Month 3: 1,000-2,000/week (SEO starting to kick in)
- Month 6: 2,000-5,000/week (organic + word-of-mouth)
- Month 12: 5,000-10,000/week (if community grows)

**5,000/month target in the unified plan is achievable by Month 4-5.** This is conservative and good.

### Email List Size as PMF Signal

| Email List Size | What It Means | Action |
|----------------|---------------|--------|
| 0-500 | Pre-PMF. Learning. | Focus on qualitative feedback (talk to every user) |
| 500-2,000 | Early signal. Some organic growth. | Start testing paid tier messaging |
| 2,000-5,000 | **PMF signal.** Organic word-of-mouth is working. | Launch paid tier. Invest in content. |
| 5,000-10,000 | Strong PMF. Ready to scale. | Consider paid acquisition to accelerate |
| 10,000+ | Category ownership. | You are the default tool. Protect the position. |

**5,000 email target in 12 months is reasonable.** If you hit it in 6 months, you have strong PMF signal.

### Recommendations

1. **Track "second scan on a different day" as your north star activation metric.** Do this because it predicts long-term retention better than any other metric.
2. **Set up Plausible Analytics (privacy-friendly) on firmislabs.com from day 1.** Do this because you need web analytics that align with your privacy-first positioning.
3. **Aim for 1,000 npm downloads/week by Month 3.** Do this because it is realistic and puts you in the top tier of new security CLI tools.
4. **Treat 2,000 email subscribers as your PMF signal to launch paid features.** Do this because if 2,000 people gave you their email, enough of them will pay.

---

## 10. Risks & Watchouts

### Risk 1: The Market Timing Trap (HIGH)

**The risk:** AI agent security is a nascent market. If AI agent adoption slows (regulatory pressure, AI winter, enterprise pushback), your TAM shrinks.

**Mitigation:** Build the product so the core scanner adds value even without the AI agent narrative. The secret detection engine, Supabase scanner, and credential exposure detection are valuable independent of AI agents. **Do this because a good security tool that also covers AI agents survives an AI winter. An AI-only tool does not.**

### Risk 2: Snyk Moves Downmarket (MEDIUM-HIGH)

**The risk:** Snyk launches a free tier of Invariant for individual developers. They have the brand, the distribution, and the engineering resources.

**Mitigation:** Move fast. Ship the multi-platform scanner (9 platforms vs their 2), build community, establish the "Firmis" brand in the prosumer segment before Snyk decides it is worth pursuing. Snyk's DNA is enterprise -- downmarket moves are slow and half-hearted (see: Snyk Free tier, which has existed for years and still has terrible developer UX). **Do this because large companies are structurally bad at prosumer products.**

### Risk 3: A Free Tool Captures the Space (MEDIUM)

**The risk:** Someone ships a free, comprehensive AI agent scanner (think: an open-source project from a FAANG security team).

**Mitigation:** This is why community threat intelligence (M4) is your real moat. A point-in-time scanner can be replicated. A network of 10,000+ developers contributing to a shared blocklist cannot. **Race to build the network effect.**

### Risk 4: False Positive Backlash (HIGH)

**The risk:** A prominent developer runs Firmis, gets false positives, tweets about it, and your credibility is destroyed.

**Mitigation:** Your current FP rate is ~3%, which is acceptable but not great. Before the HN launch: (a) run Firmis against 100 popular, known-safe MCP servers and verify zero false positives, (b) add a "Report False Positive" button to every finding, (c) have a rapid-response process to fix false positive patterns within 24 hours. **Do this because one viral "Firmis cried wolf" tweet undoes months of credibility building.**

### Risk 5: Email Gate Kills Adoption (HIGH)

**The risk:** As discussed in Section 5, gating the HTML report behind email capture will reduce your viral coefficient below 1.0, making organic growth impossible.

**Mitigation:** Remove the email gate from the CLI report. Capture emails through web properties and newsletter instead. **Do this because the report is your marketing, not your lead magnet.**

### Risk 6: Three-Scanner Dilution (MEDIUM)

**The risk:** Trying to launch three scanners simultaneously spreads engineering and marketing effort across three personas, three SEO strategies, and three launch moments. None of them gets enough attention to break through.

**Mitigation:** Launch the AI Agent Scanner first and only. Add Supabase Scanner 4-8 weeks later as a second launch moment. Defer Website Scanner until you have traction. **Do this because focused energy breaks through noise. Diluted energy does not.**

### Risk 7: "Immune System" Messaging Falls Flat (MEDIUM)

**Where it falls flat:**
- On Twitter, where you have 280 characters and no time to explain the metaphor
- On landing pages, where visitors decide in 5 seconds
- With Sara (non-technical), who does not know what an immune system does in biology, let alone in software
- In paid ad copy, where every word costs money

**Where it works:**
- In long-form blog posts where you can develop the analogy
- In conference talks where you have 30 minutes to build the narrative
- On HN, where the technical audience appreciates elegant frameworks
- In investor pitches, where the metaphor communicates vision

**Recommendation:** Use "immune system" as your INTERNAL framework and THOUGHT LEADERSHIP narrative. Use outcome-driven messaging ("find threats in 30 seconds") for EXTERNAL acquisition. **Do this because metaphors require explanation, and explanation requires attention you have not yet earned.**

### Risk 8: Pricing Too Low (MEDIUM -- Long Term)

**The risk:** $19/month is easy to adopt but hard to build a business on. 200 subscribers at $19/month = $3,800 MRR. You need 500+ subscribers to cover one engineer's salary.

**Mitigation:** Start at $19/month to maximize adoption. Introduce the Team tier ($49/month) when you have team features (M3+). Introduce Enterprise (custom pricing) when you have dashboard + SSO (M5+). **Do this because it is easier to add higher tiers later than to lower prices after launch.**

### The Biggest Marketing Mistake to Avoid

**Do not launch without the original research post.** If you launch with just "here's a new tool, try it," you will get 50 upvotes on HN and be forgotten. If you launch with "we scanned 4,812 AI agent skills and found 341 malicious ones -- here's the data, and here's a free tool to check your own," you will get 500 upvotes and be remembered.

The research is your credibility. The tool is your conversion mechanism. Without the research, the tool is just another CLI scanner. With the research, the tool is the thing you run after reading the terrifying data.

**Do this because at Snyk, the "State of Open Source Security" report generated more pipeline than every other content asset combined. Data-driven launches outperform product-driven launches by 5-10x for security tools.**

---

## Appendix: 90-Day Marketing Action Plan

### Days 1-30: Pre-Launch

| Day | Action | Owner | Success Metric |
|-----|--------|-------|----------------|
| 1-5 | Finalize "State of AI Agent Security" research methodology | Founder | Methodology documented |
| 5-10 | Run scan against all public MCP servers on npm + ClawHub skills | Engineering | Scan data collected |
| 10-15 | Write research report + blog post | Founder | Draft complete |
| 15-18 | Set up firmislabs.com landing page with email capture | Engineering | Page live |
| 18-20 | Record terminal demo GIF | Founder | GIF <30s, looks clean |
| 20-22 | Recruit 20 beta testers via Twitter DMs | Founder | 20 testers confirmed |
| 22-25 | Ship to beta testers, collect feedback | Engineering | 10 feedback reports |
| 25-28 | Fix issues from beta feedback | Engineering | All critical fixed |
| 28-30 | Prepare HN post, Reddit posts, Twitter thread | Founder | All content drafted |

### Days 31-60: Launch

| Day | Action | Owner | Success Metric |
|-----|--------|-------|----------------|
| 31 | HN "Show HN" launch (Monday AM EST) | Founder | 100+ upvotes |
| 31 | Twitter research thread (same day) | Founder | 100+ retweets |
| 32 | Reddit r/netsec research post | Founder | 50+ upvotes |
| 33 | Reddit r/ClaudeAI + r/LocalLLaMA personal story | Founder | 30+ upvotes each |
| 34 | Dev.to technical blog post | Founder | 100+ reactions |
| 35 | Product Hunt launch | Founder | Top 5 in Security |
| 36-40 | Respond to every comment, DM, email | Founder | 100% response rate |
| 41-50 | First newsletter issue | Founder | 200+ subscribers |
| 50-60 | "What we learned from our launch" blog post | Founder | Continued engagement |

### Days 61-90: Post-Launch Growth

| Day | Action | Owner | Success Metric |
|-----|--------|-------|----------------|
| 61-65 | Launch Supabase Scanner ("Show HN" #2) | Engineering/Founder | 50+ upvotes |
| 65-70 | Submit to Supabase community tools | Founder | Listed |
| 70-75 | Publish "is Cursor safe to use" SEO post | Founder | Ranking in 30 days |
| 75-80 | Build "Scanned by Firmis" badge | Engineering | Badge live |
| 80-85 | Submit badge PRs to 10 popular MCP servers | Founder | 3+ accepted |
| 85-90 | Month 2 "AI Agent Threat Digest" | Founder | 500+ subscribers |

---

## Final Notes

Firmis has a real product with genuine differentiation. The multi-platform coverage, the zero-config CLI, and the prosumer positioning are defensible. The biggest threats to the GTM are execution risks, not strategy risks:

1. **Do not dilute your launch across three scanners.** Focus beats breadth.
2. **Do not gate the report behind email.** The report IS your marketing.
3. **Do not sell futures.** Only market what is shipped today.
4. **Do not skip the original research.** Data-driven launches are 5-10x more effective.
5. **Do not underestimate the 15 hours/week of marketing effort required.** Developer tools do not sell themselves.

The immune system thesis is architecturally sound and intellectually compelling. Use it for thought leadership and long-form content. But on the landing page, on Twitter, and in your first 10 seconds with a new user, lead with the problem and the outcome, not the metaphor.

Ship the research post. Nail the HN launch. Build the badge. Race to community threat intelligence. Everything else is optimization.

---

*Document Version: 1.0*
*Review Date: 2026-02-17*
*Next Review: After HN launch*
