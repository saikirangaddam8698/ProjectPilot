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
  // 1. User personal queue / assigned tickets (Simple route, fast path)
  {
    patterns: [
      /\b(my\s+tickets?|my\s+tasks?|my\s+work|my\s+queue|my\s+backlog|assigned\s+to\s+me|assigned\s+to\s+myself)\b/i,
      /\bwhat\s+(are\s+)?(the\s+)?tickets?\s+(are\s+)?assigned\s+to\s+me(\s+in\s+this\s+project)?\b/i,
      /\bwhat\s+(are\s+)?(the\s+)?tickets?\s+(are\s+)?(in\s+)?my\s+queue\b/i,
      /\bwhat\s+(are\s+)?my\s+(assigned\s+)?(tickets?|tasks?|items?|work)\b/i,
      /\bwhat\s+do\s+i\s+have\s+to\s+do\b/i,
      /\bwhat\s+should\s+i\s+work\s+on\b/i,
      /\bwhat('?s|\s+is)\s+in\s+my\s+queue\b/i,
      /\bwhat('?s|\s+is)\s+on\s+my\s+plate\b/i,
      /\bwhich\s+(tickets?|tasks?)\s+(are\s+)?assigned\s+to\s+me\b/i,
      /\bwhich\s+(tickets?|tasks?)\s+am\s+i\s+working\s+on\b/i,
      /\bshow\s+(me\s+)?my\s+(tickets?|tasks?|work)\b/i,
      /\blist\s+(my\s+)?(tickets?|tasks?)\s+(assigned\s+to\s+me|in\s+my\s+queue)\b/i,
      /\btasks?\s+assigned\s+to\s+me\b/i,
      /\bwork\s+assigned\s+to\s+me\b/i,
      /\bitems?\s+assigned\s+to\s+me\b/i,
      /\bmy\s+assigned\s+(tickets?|tasks?|issues?)\b/i,
      /\bmy\s+queue\b/i
    ],
    tool: 'list_project_tickets',
    scope: 'user',
    loadingHint: 'Checking tickets assigned to you in this project…'
  },

  // 2. User assigned projects / workspace access
  {
    patterns: [
      /\b(what\s+(are\s+)?(the\s+)?projects?\s+(are\s+)?assigned(\s+to\s+me)?)\b/i,
      /\b(what\s+projects?\s+am\s+i\s+assigned\s+to)\b/i,
      /\b(what\s+projects?\s+do\s+i\s+have(\s+access\s+to)?)\b/i,
      /\b(my\s+projects?|projects?\s+assigned\s+to\s+me)\b/i,
      /\b(list|show)\s+(my\s+)?assigned\s+projects?\b/i,
      /\bwhich\s+projects?\s+am\s+i\s+(on|part\s+of|member\s+of)\b/i,
      /\bwhich\s+projects?\s+do\s+i\s+belong\s+to\b/i
    ],
    tool: 'get_project_summary',
    scope: 'project',
    loadingHint: 'Checking your assigned projects…'
  },

  // 3. Deadlines, due dates & sprint schedule
  {
    patterns: [
      /\bwhat\s+(is|are|'?s)\s+(the\s+)?deadlines?\b/i,
      /\bwhen\s+is\s+(the\s+)?(sprint\s+)?deadline\b/i,
      /\b(sprint\s+deadline|ticket\s+deadline|project\s+deadline)\b/i,
      /\bwhen\s+does\s+(the\s+)?(current\s+)?sprint\s+(end|finish|close|conclude)\b/i,
      /\bwhen\s+is\s+(the\s+sprint|it|this)\s+due\b/i,
      /\bdue\s+dates?\b/i,
      /\bhow\s+many\s+days\s+(are\s+)?(left|remaining)\b/i,
      /\bhow\s+much\s+time\s+(is\s+)?left\b/i,
      /\b(sprint\s+end\s+date|sprint\s+dates?|sprint\s+schedule)\b/i,
      /\b(target\s+date|delivery\s+date|target\s+deadline)\b/i
    ],
    tool: 'get_sprint_progress',
    loadingHint: 'Checking sprint deadlines and schedule…'
  },

  // 4. Specific ticket key lookup (e.g. PILOT-104, INFRA-12, MOBILE-5)
  {
    patterns: [
      /\b(?:tell\s+me\s+about|details?\s+(?:of|for)|what\s+is|status\s+of|show(?:\s+me)?)\s+([A-Za-z]{2,10}-\d+)\b/i,
      /\b([A-Za-z]{2,10}-\d+)\s+(?:details?|status|info|description)\b/i
    ],
    tool: 'get_ticket_details',
    extractArgs: (m) => ({ ticketKey: m[1].toUpperCase() }),
    loadingHint: 'Retrieving ticket details…'
  },

  // 5. High Priority, Critical, Urgent Tickets & Blockers
  {
    patterns: [
      /\bwhich\s+(tickets?|tasks?)\s+are\s+(currently\s+)?(high\s+priority|urgent|critical)\b/i,
      /\b(high\s+priority|urgent|critical)\s+(tickets?|tasks?|bugs?|issues?)\b/i,
      /\bwhat\s+(tickets?|tasks?|issues?)\s+(are\s+)?(high\s+priority|urgent|critical)\b/i,
      /\bany\s+blockers?\b/i,
      /\bshow\s+(me\s+)?(high\s+priority|urgent|critical)\s+(tickets?|tasks?|bugs?|issues?)\b/i,
      /\btickets?\s+(are\s+)?(high\s+priority|urgent|critical)\b/i,
      /\b(blockers?|blocked\s+tickets?)\b/i
    ],
    tool: 'list_project_tickets',
    args: { priority: 'High' },
    loadingHint: 'Checking high priority and urgent tickets…'
  },

  // 6. Tickets In Progress
  {
    patterns: [
      /\bwhat\s+(tickets?|tasks?)\s+(are\s+)?(currently\s+)?in\s+progress\b/i,
      /\bshow\s+(me\s+)?(the\s+)?in\s+progress\s+(tickets?|tasks?|work)\b/i,
      /\bwhat\s+(is|are)\s+(currently\s+)?being\s+worked\s+on\b/i,
      /\bactive\s+(tickets?|tasks?|work)\b/i
    ],
    tool: 'list_project_tickets',
    args: { status: 'In Progress' },
    loadingHint: 'Checking in-progress tickets…'
  },

  // 7. Tickets In Review
  {
    patterns: [
      /\bwhat\s+(tickets?|tasks?)\s+(are\s+)?(in\s+review|pending\s+review)\b/i,
      /\bshow\s+(me\s+)?(tickets?|tasks?)\s+(in\s+review|ready\s+for\s+review)\b/i,
      /\breview\s+queue\b/i
    ],
    tool: 'list_project_tickets',
    args: { status: 'In Review' },
    loadingHint: 'Checking tickets in review…'
  },

  // 8. Backlog Tickets
  {
    patterns: [
      /\bwhat\s+(tickets?|tasks?)\s+(are\s+)?(in\s+)?(the\s+)?backlog\b/i,
      /\bshow\s+(me\s+)?(the\s+)?backlog\s*(tickets?|tasks?|items?)?\b/i,
      /\bproduct\s+backlog\b/i
    ],
    tool: 'list_project_tickets',
    args: { status: 'Backlog' },
    loadingHint: 'Loading backlog tickets…'
  },

  // 9. Sprint factual info, progress, velocity & story points
  {
    patterns: [
      /\bhow\s+(is|'?s)\s+(the\s+)?(current\s+)?sprint\s+progressing\b/i,
      /\bsprint\s+progress\b/i,
      /\bwhat\s+(is|'?s)\s+(the\s+)?(current\s+)?sprint(\s+goal)?\b/i,
      /\bcurrent\s+sprint\s+(goal|name|dates?)\b/i,
      /\bhow\s+many\s+(story\s+points?|points?)\s+(are\s+)?(done|complet|remain)/i,
      /\b(sprint\s+)?velocity\b/i,
      /\bhow\s+many\s+tickets?\s+(are\s+)?(complet|done|finish|closed|resolved)/i,
      /\bnumber\s+of\s+(complet|done|finish)\s+tickets?/i,
      /\btickets?\s+(complet|done|finish)ed\b/i
    ],
    tool: 'get_sprint_progress',
    loadingHint: 'Checking sprint progress and metrics…'
  },

  // 10. Project Lead, Manager & Team Members
  {
    patterns: [
      /\bwho\s+(is|'?s)\s+(the\s+)?(project\s+)?(lead|manager|leader|owner)\b/i,
      /\bwho\s+leads\s+(this\s+)?project\b/i,
      /\bwho\s+(is|are)\s+(on\s+)?(the\s+)?(team|project\s+team|members)\b/i,
      /\b(list|show)\s+(the\s+)?(team\s+members?|project\s+members?)\b/i,
      /\bteam\s+members?\b/i,
      /\bhow\s+many\s+(people|members?)\s+(are\s+)?(in|on)\s+(this\s+)?(team|project)\b/i
    ],
    tool: 'get_project_summary',
    loadingHint: 'Loading project leadership and team members…'
  },

  // 11. Recent activity / what changed
  {
    patterns: [
      /\bwhat\s+(changed|happened|'?s new|'?s happening|was\s+done)\b/i,
      /\brecent\s*(activity|changes?|updates?|events?)\b/i,
      /\bproject\s+activity\b/i,
      /\bwhat\s+'?s\s+been\s+(happening|going\s+on)\b/i,
      /\baudit\s+log\b/i,
      /\blatest\s+(updates?|changes?|activity)\b/i
    ],
    tool: 'get_project_activity',
    loadingHint: 'Reviewing recent project activity…'
  },

  // 12. Executive summary / project overview
  {
    patterns: [
      /\bgive\s+me\s+a\s+(quick\s+)?summary\b/i,
      /\bproject\s+(overview|health|status)\b/i,
      /\bexecutive\s+summary\b/i,
      /\bstatus\s+of\s+this\s+project\b/i
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
  /\bbiggest\s+risk/i,
  /\bwhy\s+(is|are|was|were)\b/i,
  /\broot\s+cause/i,
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
  /\bteam\s+(capacity|workload|bandwidth)\b/i
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
  /\badr\b/i
];

export class QuestionClassifier {
  /**
   * Classify a user question for agent routing.
   *
   * @param {string} message - Raw user message
   * @param {string} [currentProjectKey] - Active workspace project key (e.g. PILOT)
   * @returns {{ type: 'simple'|'analytical'|'out_of_project', tool: string|null, scope?: 'user'|'project', args?: object, loadingHint: string, requestedProject?: string, currentProject?: string }}
   */
  static classify(message, currentProjectKey = null) {
    if (!message || typeof message !== 'string') {
      return { type: 'analytical', tool: null, scope: 'project', loadingHint: 'Analyzing your request…' };
    }

    const pKey = currentProjectKey ? currentProjectKey.toUpperCase() : null;

    // 0. Detect explicit out-of-project workspace queries
    if (pKey) {
      const outOfProjMatch = message.match(/\b(in|from|for|belonging\s+to)\s+(the\s+)?([A-Z]{3,10})\b/i);
      if (outOfProjMatch) {
        const requestedProj = outOfProjMatch[3].toUpperCase();
        if (['PILOT', 'INFRA', 'MOBILE', 'CORE', 'CLOUD'].includes(requestedProj) && requestedProj !== pKey) {
          return {
            type: 'out_of_project',
            tool: null,
            scope: 'project',
            requestedProject: requestedProj,
            currentProject: pKey,
            loadingHint: 'Checking project boundary…'
          };
        }
      }
    }

    // 1. Check analytical overrides first — these always get the full loop
    for (const pattern of ANALYTICAL_OVERRIDES) {
      if (pattern.test(message)) {
        return { type: 'analytical', tool: null, scope: 'project', loadingHint: 'Analyzing project data…' };
      }
    }

    // 2. Check for simple single-tool routes
    for (const route of SIMPLE_ROUTES) {
      for (const pattern of route.patterns) {
        const match = message.match(pattern);
        if (match) {
          const args = route.extractArgs ? route.extractArgs(match) : (route.args || {});
          return {
            type: 'simple',
            tool: route.tool,
            scope: route.scope || 'project',
            args,
            loadingHint: route.loadingHint
          };
        }
      }
    }

    // 3. Default: full agent loop
    return { type: 'analytical', tool: null, scope: 'project', loadingHint: 'Analyzing project data…' };
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
