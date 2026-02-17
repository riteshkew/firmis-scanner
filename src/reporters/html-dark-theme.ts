export function getDarkThemeStyles(): string {
  return `
    body.dark {
      --bg: #1a1a2e;
      --surface: #16213e;
      --text: #e0e0e0;
      --text-muted: #9ca3af;
      --card-bg: #0f3460;
      --border: #1a1a4e;
      --container-bg: #16213e;
      --summary-card-bg: #0f3460;
      --code-bg: #0a2540;
      --footer-bg: #0f3460;
      --header-from: #1a0533;
      --header-to: #2d1b69;
    }

    body.dark {
      background: var(--bg);
      color: var(--text);
    }

    body.dark .container {
      background: var(--container-bg);
      box-shadow: 0 2px 16px rgba(0,0,0,0.5);
    }

    body.dark .header {
      background: linear-gradient(135deg, var(--header-from) 0%, var(--header-to) 100%);
    }

    body.dark .summary {
      border-bottom-color: var(--border);
    }

    body.dark .summary h2,
    body.dark .platform-header h2 {
      color: var(--text);
    }

    body.dark .summary-card {
      background: var(--summary-card-bg);
      border-color: var(--border);
    }

    body.dark .summary-card h3 {
      color: var(--text-muted);
    }

    body.dark .summary-card p {
      color: var(--text);
    }

    body.dark .platform-section {
      border-bottom-color: var(--border);
    }

    body.dark .platform-stats {
      color: var(--text-muted);
    }

    body.dark .threat {
      background: var(--card-bg);
      border-color: var(--border);
    }

    body.dark .threat-header.severity-critical {
      background: #3d0000;
    }

    body.dark .threat-header.severity-high {
      background: #2d0a0a;
    }

    body.dark .threat-header.severity-medium {
      background: #2d1a00;
    }

    body.dark .threat-header.severity-low {
      background: #001a2d;
    }

    body.dark .threat-title {
      color: var(--text);
    }

    body.dark .threat-section h4 {
      color: var(--text-muted);
    }

    body.dark .evidence-item {
      border-bottom-color: var(--border);
      color: var(--text);
    }

    body.dark .code-location {
      background: var(--code-bg);
      color: #93c5fd;
    }

    body.dark .footer {
      background: var(--footer-bg);
      color: var(--text-muted);
    }

    body.dark .runtime-risks-card {
      background: var(--card-bg);
      border-color: #1a3a5e;
    }

    body.dark .runtime-risks-card h3 {
      color: #60a5fa;
    }

    body.dark .runtime-risks-card p {
      color: var(--text-muted);
    }

    body.dark .runtime-risk-item {
      color: var(--text);
      border-bottom-color: var(--border);
    }
  `
}
