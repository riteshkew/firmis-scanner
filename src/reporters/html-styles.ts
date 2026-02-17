export function getHtmlStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .header p {
      opacity: 0.9;
      font-size: 0.95rem;
    }

    .summary {
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .summary h2 {
      margin-bottom: 1.5rem;
      color: #333;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .summary-card.danger {
      border-left-color: #e74c3c;
    }

    .summary-card.warning {
      border-left-color: #f39c12;
    }

    .summary-card.success {
      border-left-color: #27ae60;
    }

    .summary-card h3 {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-card p {
      font-size: 2rem;
      font-weight: 600;
      color: #333;
    }

    .platform-section {
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .platform-section:last-of-type {
      border-bottom: none;
    }

    .platform-header {
      margin-bottom: 1.5rem;
    }

    .platform-header h2 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .platform-stats {
      color: #666;
      font-size: 0.9rem;
    }

    .threat {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .threat-header {
      padding: 1rem 1.5rem;
      border-left: 4px solid #e74c3c;
    }

    .threat-header.severity-critical {
      border-left-color: #c0392b;
      background: #fdecea;
    }

    .threat-header.severity-high {
      border-left-color: #e74c3c;
      background: #fdecea;
    }

    .threat-header.severity-medium {
      border-left-color: #f39c12;
      background: #fef5e7;
    }

    .threat-header.severity-low {
      border-left-color: #3498db;
      background: #ebf5fb;
    }

    .threat-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .threat-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
    }

    .threat-meta span {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-critical {
      background: #c0392b;
      color: white;
    }

    .badge-high {
      background: #e74c3c;
      color: white;
    }

    .badge-medium {
      background: #f39c12;
      color: white;
    }

    .badge-low {
      background: #3498db;
      color: white;
    }

    .threat-body {
      padding: 1.5rem;
    }

    .threat-section {
      margin-bottom: 1.5rem;
    }

    .threat-section:last-child {
      margin-bottom: 0;
    }

    .threat-section h4 {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .evidence-list {
      list-style: none;
    }

    .evidence-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .evidence-item:last-child {
      border-bottom: none;
    }

    .evidence-item::before {
      content: "→";
      color: #667eea;
      margin-right: 0.5rem;
      font-weight: bold;
    }

    .code-location {
      background: #f8f9fa;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.875rem;
      color: #555;
    }

    .footer {
      padding: 2rem;
      background: #f8f9fa;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }

    .no-threats {
      text-align: center;
      padding: 3rem;
      color: #27ae60;
    }

    .no-threats svg {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
    }
    `
}
