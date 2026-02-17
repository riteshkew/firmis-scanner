export function getHtmlStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f0f2f5;
      padding: 2rem;
      scroll-behavior: smooth;
      transition: background 0.3s, color 0.3s;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
      transition: background 0.3s, box-shadow 0.3s;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2.5rem 2rem;
      position: relative;
    }

    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .header-info h1 {
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }

    .header-info p { opacity: 0.9; font-size: 0.9rem; }

    .grade-badge {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 4px solid rgba(255,255,255,0.4);
      background: rgba(0,0,0,0.2);
      flex-shrink: 0;
      backdrop-filter: blur(4px);
    }

    .grade-letter {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
    }

    .grade-label {
      font-size: 0.6rem;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .theme-toggle {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.4rem 0.875rem;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: background 0.2s;
    }

    .theme-toggle:hover { background: rgba(255,255,255,0.25); }

    .summary {
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
      transition: border-color 0.3s;
    }

    .summary h2 { margin-bottom: 1.5rem; color: #333; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      background: #f8f9fa;
      padding: 1.25rem 1.5rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      transition: transform 0.15s, box-shadow 0.15s, background 0.3s;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .summary-card.danger { border-left-color: #e74c3c; }
    .summary-card.warning { border-left-color: #f39c12; }
    .summary-card.success { border-left-color: #27ae60; }

    .summary-card h3 {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-card p { font-size: 1.875rem; font-weight: 700; color: #333; }

    .severity-bar-row {
      margin-top: 1.25rem;
    }

    .severity-bar-row h3 {
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .severity-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .severity-bar-label {
      font-size: 0.8rem;
      width: 52px;
      font-weight: 600;
      text-align: right;
    }

    .severity-bar-track {
      flex: 1;
      height: 10px;
      background: #e9ecef;
      border-radius: 5px;
      overflow: hidden;
    }

    .severity-bar-fill {
      height: 100%;
      border-radius: 5px;
      width: 0;
      animation: growBar 0.8s ease forwards;
    }

    @keyframes growBar {
      from { width: 0; }
      to { width: var(--target-width); }
    }

    .severity-bar-fill.critical { background: #c0392b; }
    .severity-bar-fill.high { background: #e74c3c; }
    .severity-bar-fill.medium { background: #f39c12; }
    .severity-bar-fill.low { background: #3498db; }

    .severity-bar-count {
      font-size: 0.8rem;
      font-weight: 600;
      width: 28px;
      color: #555;
    }

    .platform-section {
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
      transition: border-color 0.3s;
    }

    .platform-section:last-of-type { border-bottom: none; }

    .platform-header { margin-bottom: 1.5rem; }
    .platform-header h2 { color: #333; margin-bottom: 0.4rem; }
    .platform-stats { color: #666; font-size: 0.9rem; }

    .threat {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.15s, background 0.3s, border-color 0.3s;
    }

    .threat:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    .threat-header {
      padding: 1rem 1.5rem;
      border-left: 4px solid #e74c3c;
    }

    .threat-header.severity-critical { border-left-color: #c0392b; background: #fdecea; }
    .threat-header.severity-high { border-left-color: #e74c3c; background: #fdecea; }
    .threat-header.severity-medium { border-left-color: #f39c12; background: #fef5e7; }
    .threat-header.severity-low { border-left-color: #3498db; background: #ebf5fb; }

    .threat-title {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 0.6rem;
      color: #333;
    }

    .threat-meta {
      display: flex;
      gap: 0.875rem;
      flex-wrap: wrap;
      font-size: 0.85rem;
      align-items: center;
    }

    .threat-actions {
      margin-top: 0.75rem;
    }

    .copy-claude-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 0.35rem 0.875rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      letter-spacing: 0.02em;
    }

    .copy-claude-btn:hover { opacity: 0.9; transform: scale(1.02); }
    .copy-claude-btn:active { transform: scale(0.98); }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-critical { background: #c0392b; color: white; }
    .badge-high { background: #e74c3c; color: white; }
    .badge-medium { background: #f39c12; color: white; }
    .badge-low { background: #3498db; color: white; }

    .threat-body { padding: 1.5rem; }

    .threat-section { margin-bottom: 1.25rem; }
    .threat-section:last-child { margin-bottom: 0; }

    .threat-section h4 {
      font-size: 0.78rem;
      color: #666;
      margin-bottom: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .evidence-list { list-style: none; }

    .evidence-item {
      padding: 0.4rem 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 0.9rem;
    }

    .evidence-item:last-child { border-bottom: none; }

    .evidence-item::before {
      content: "→";
      color: #667eea;
      margin-right: 0.5rem;
      font-weight: bold;
    }

    .code-location {
      background: #f8f9fa;
      padding: 0.6rem 1rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.85rem;
      color: #555;
      transition: background 0.3s, color 0.3s;
    }

    .runtime-risks {
      padding: 2rem;
      border-top: 2px solid #f0f0f0;
      transition: border-color 0.3s;
    }

    .runtime-risks-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .runtime-risks-card h3 {
      color: #1d4ed8;
      margin-bottom: 0.25rem;
      font-size: 1rem;
    }

    .runtime-risks-card > p {
      color: #4b5563;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .runtime-risk-item {
      padding: 0.4rem 0;
      border-bottom: 1px solid #dbeafe;
      font-size: 0.875rem;
      color: #1e3a5f;
    }

    .runtime-risk-item:last-child { border-bottom: none; }

    .runtime-risk-item::before {
      content: "◉";
      color: #3b82f6;
      margin-right: 0.5rem;
    }

    .footer {
      padding: 2rem;
      background: #f8f9fa;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
      transition: background 0.3s, color 0.3s;
    }

    .firmis-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 1rem;
      padding: 0.4rem 0.875rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 20px;
      text-decoration: none;
      color: white;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      transition: opacity 0.2s, transform 0.15s;
    }

    .firmis-badge:hover { opacity: 0.9; transform: scale(1.03); }

    .no-threats {
      text-align: center;
      padding: 3rem;
      color: #27ae60;
    }

    .no-threats svg { width: 64px; height: 64px; margin-bottom: 1rem; }
  `
}
