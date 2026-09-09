/**
 * Shared message formatting utility for ProjectPilot AI Assistant and Quick Chat.
 * Supports headings, bold, inline code, blockquotes, ticket references (e.g. PILOT-104), and bullet lists.
 */

export function formatMessageContent(content) {
  if (!content) return '';

  // Basic safe markdown-like formatting for bold, headers, blockquotes, and lists
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="chat-h3">$1</h3>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="chat-h4">$1</h4>');

  // Blockquotes: > quote
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="chat-quote">$1</blockquote>');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Ticket chip formatting for keys like PILOT-104 or MOBILE-22
  html = html.replace(/\b([A-Z]{2,10}-\d+)\b/g, '<span class="chat-ticket-ref">$1</span>');

  // Bullet points (- or •)
  html = html.replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul class="chat-bullet-list">$1</ul>');

  // Clean empty paragraphs / double breaks
  const paragraphs = html.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h3') || p.startsWith('<h4') || p.startsWith('<ul') || p.startsWith('<blockquote')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('');
}
