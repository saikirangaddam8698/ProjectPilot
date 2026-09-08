/**
 * Question Classifier — AI Agent Fast-Path Routing
 *
 * Classifies user messages into:
 *   - 'simple'     → single known tool, can skip Gemini round 1, faster response
 *   - 'analytical' → multi-source reasoning needed, full agent loop
 *
 * Security: classification never bypasses ToolExecutor RBAC. The fast path still
 * calls ToolExecutor.execute() with the authenticated user, preserving all
 * project membership checks.
 */

/**
 * Simple question routes — each pattern maps to a single tool.
 * Order matters: more specific patterns first.
 */
const SIMPLE_ROUTES = [
  // Sprint factual info: current sprint name/goal/points
  {
    patterns: [
      /\bwhat\s+(is|'?s)\s+(the\s+)?(current\s+)?sprint(\s+goal)?\b/i,
      /\bcurrent\s+sprint\s+(goal|name|dates?)\b/i,
      /\bhow\s+many\s+(story\s+points?|points?)\s+(are\s+)?(done|complet|remain)/i,
      /\b(sprint\s+)?velocity\b/i,
    ],
    tool: 'get_sprint_progress',
    loadingHint: 'Checking sprint metrics…'
  },
  // Completed / done ticket counts
  {
    patterns: [
      /\bhow\s+many\s+tickets?\s+(are\s+)?(complet|done|finish|closed|resolved)/i,
      /\bnumber\s+of\s+(complet|done|finish)\s+tickets?/i,
      /\btickets?\s+(complet|done|finish)ed\b/i,
    ],
    tool: 'get_sprint_progress',
    loadingHint: 'Counting completed tickets…'
  },
  // Tickets in progress or blocked
  {
    patterns: [
      /\bhow\s+many\s+tickets?\s+(are\s+)?(in\s+progress|todo|backlog|block|stuck|urgent)/i,
      /\bnumber\s+of\s+(in\s+progress|block|urgent)\s+tickets?/i,
    ],
    tool: 'list_project_tickets',
    loadingHint: 'Checking ticket status…'
  },
  // Recent activity / what changed
  {
    patterns: [
      /\bwhat\s+(changed|happened|'?s new|'?s happening|was\s+done)\b/i,
      /\brecent\s*(activity|changes?|updates?|events?)\b/i,
      /\bproject\s+activity\b/i,
      /\bwhat\s+'?s\s+been\s+(happening|going\s+on)\b/i,
      /\baudit\s+log\b/i,
      /\blatest\s+(updates?|changes?|activity)\b/i,
    ],
    tool: 'get_project_activity',
    loadingHint: 'Reviewing recent project activity…'
  },
  // Executive summary / project overview (simple, not deep analytics)
  {
    patterns: [
      /\bgive\s+me\s+a\s+(quick\s+)?summary\b/i,
      /\bproject\s+(overview|health|status)\b/i,
      /\bexecutive\s+summary\b/i,
    ],
    tool: 'get_project_summary',
    loadingHint: 'Loading project overview…'
  }
];

/**
 * Signals that force the full analytical agent loop even if a simple pattern matches.
 * These questions need multi-source reasoning, cross-referencing, or deep analysis.
 */
const ANALYTICAL_OVERRIDES = [
  /\bhow\s+(is|'?s)\s+(the\s+)?(current\s+)?sprint\s+progressing\b/i,
  /\bsprint\s+progress\b/i,
  /\bbiggest\s+risk/i,
  /\bwhy\s+(is|are|was|were)\b/i,
  /\broot\s+cause/i,
  /\bbehind\s+schedule/i,
  /\bcompare\s+(with|to|against|our)\b/i,
  /\bwhat\s+(does|did|do)\s+.{1,25}\s+(say|mention|describe|document)/i,
  /\bhow\s+does\s+.{1,30}\s+(work|implement|function)/i,
  /\barchitecture\b/i,
  /\brunbook\b/i,
  /\bspec(ification)?\b/i,
  /\bdeployment\b/i,
  /\bdocumentation?\b/i,
  /\baccording\s+to\b/i,
  /\bauth(entication|orization|)\s+(flow|implement|how|work)/i,
  /\bpooling\b/i,
  /\bapi\s+(spec|design|doc)/i,
  /\bimpediment\b/i,
  /\bdelivery\s+risk\b/i,
  /\bsprint\s+(risk|forecast|outlook)/i,
  /\bteam\s+(capacity|workload|bandwidth)\b/i,
];

/**
 * Signals that the question is about documentation/knowledge and needs RAG.
 */
const RAG_SIGNALS = [
  /\barchitecture\b/i,
  /\brunbook\b/i,
  /\bspec(ification)?\b/i,
  /\bdeployment\b/i,
  /\bdocument(ation)?\b/i,
  /\bhow\s+does\s+.{1,30}\s+(work|implement|function)/i,
  /\bauth(entication|orization)?\s+(flow|implement|how|work)/i,
  /\bpooling\b/i,
  /\bapi\s+(spec|design|doc|endpoint)/i,
  /\baccording\s+to\b/i,
  /\bdesign\s+(decision|pattern|doc)/i,
  /\badr\b/i,
];

export class QuestionClassifier {
  /**
   * Classify a user question for agent routing.
   *
   * @param {string} message - Raw user message
   * @returns {{ type: 'simple'|'analytical', tool: string|null, loadingHint: string }}
   */
  static classify(message) {
    if (!message || typeof message !== 'string') {
      return { type: 'analytical', tool: null, loadingHint: 'Analyzing your request…' };
    }

    // 1. Check analytical overrides first — these always get the full loop
    for (const pattern of ANALYTICAL_OVERRIDES) {
      if (pattern.test(message)) {
        return { type: 'analytical', tool: null, loadingHint: 'Analyzing project data…' };
      }
    }

    // 2. Check for simple single-tool routes
    for (const route of SIMPLE_ROUTES) {
      for (const pattern of route.patterns) {
        if (pattern.test(message)) {
          return { type: 'simple', tool: route.tool, loadingHint: route.loadingHint };
        }
      }
    }

    // 3. Default: full agent loop
    return { type: 'analytical', tool: null, loadingHint: 'Analyzing project data…' };
  }

  /**
   * Whether this message requires RAG (knowledge search) tool to be offered.
   * Used to scope tool declarations: pure live-data questions don't need RAG.
   *
   * @param {string} message
   * @returns {boolean}
   */
  static needsRAG(message) {
    if (!message) return false;
    return RAG_SIGNALS.some((pattern) => pattern.test(message));
  }

  /**
   * Build a scoped tool declarations list (omits RAG for live-data questions).
   * Reduces Gemini's chance of calling an expensive vector search unnecessarily.
   *
   * @param {string} message
   * @param {Array<object>} allDeclarations - Full function declarations array
   * @returns {Array<object>} Scoped declarations (may omit search_project_knowledge)
   */
  static scopeToolDeclarations(message, allDeclarations) {
    if (this.needsRAG(message)) {
      return allDeclarations; // Full tool set for documentation questions
    }

    // For live-data questions, exclude RAG to prevent unnecessary vector searches
    return allDeclarations.map((group) => ({
      ...group,
      functionDeclarations: (group.functionDeclarations || []).filter(
        (fn) => fn.name !== 'search_project_knowledge'
      )
    }));
  }
}
