/**
 * Activity Synthesizer Service
 * Translates raw project activity / audit log events into natural-language project intelligence.
 * Correlates related entity events, preserves real actor names & ticket keys,
 * formats human-readable dates, and generates grounded risk/impact interpretations.
 */

export class ActivitySynthesizer {
  /**
   * Format ISO date string into natural human-readable date & time
   */
  static formatNaturalDate(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[d.getMonth()];
      const day = d.getDate();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' should be '12'

      return `${month} ${day} at ${hours}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  }

  /**
   * Format a date into a simple month and day (e.g. "September 12")
   */
  static formatSimpleDate(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[d.getMonth()]} ${d.getDate()}`;
    } catch {
      return '';
    }
  }

  /**
   * Group and correlate activities by entity (ticketKey or sprintName)
   */
  static correlateEvents(activities) {
    const ticketGroups = new Map();
    const otherEvents = [];

    for (const act of activities) {
      if (act.targetKey && (act.targetType?.toLowerCase() === 'ticket' || act.targetKey.includes('-'))) {
        const key = act.targetKey;
        if (!ticketGroups.has(key)) {
          ticketGroups.set(key, []);
        }
        ticketGroups.get(key).push(act);
      } else {
        otherEvents.push(act);
      }
    }

    return { ticketGroups, otherEvents };
  }

  /**
   * Translate a single activity record into a natural English sentence
   */
  static formatSingleEvent(act) {
    const actor = act.actorName || act.actor || 'A team member';
    const key = act.targetKey;
    const title = act.targetTitle ? ` ("${act.targetTitle}")` : '';
    const timeStr = this.formatNaturalDate(act.timestamp || act.createdAt);
    const timeSuffix = timeStr ? ` on ${timeStr}` : '';
    const meta = act.metadata || {};

    const actionLower = (act.action || act.type || '').toLowerCase();

    if (actionLower === 'created' || actionLower === 'created_item') {
      const priority = act.priority || meta.priority;
      const dueDate = act.dueDate || meta.dueDate ? this.formatSimpleDate(act.dueDate || meta.dueDate) : null;
      let desc = `${actor} created **${key}**${title}${priority ? ` with ${priority} priority` : ''}`;
      if (dueDate) desc += ` and a ${dueDate} deadline`;
      return `${desc}${timeSuffix}.`;
    }

    if (actionLower === 'status_changed') {
      const fromStatus = act.oldValue || meta.fromStatus || meta.previousStatus;
      const toStatus = act.newValue || act.status || meta.toStatus || meta.newStatus;
      if (fromStatus && toStatus) {
        return `${actor} moved **${key}**${title} from **${fromStatus}** to **${toStatus}**${timeSuffix}.`;
      }
      if (toStatus) {
        return `${actor} moved **${key}**${title} to **${toStatus}**${timeSuffix}.`;
      }
      return `${actor} updated the status of **${key}**${title}${timeSuffix}.`;
    }

    if (actionLower === 'priority_changed') {
      const fromPriority = act.oldValue || meta.fromPriority || meta.previousPriority;
      const toPriority = act.newValue || act.priority || meta.toPriority || meta.newPriority;
      if (fromPriority && toPriority) {
        return `${actor} changed **${key}**${title}'s priority from **${fromPriority}** to **${toPriority}**${timeSuffix}.`;
      }
      if (toPriority) {
        return `${actor} raised **${key}**${title}'s priority to **${toPriority}**${timeSuffix}.`;
      }
      return `${actor} updated the priority of **${key}**${title}${timeSuffix}.`;
    }

    if (actionLower === 'sprint_started') {
      const sprintName = act.sprintName || act.targetTitle || 'the sprint';
      return `${actor} started sprint **${sprintName}**${timeSuffix}.`;
    }

    if (actionLower === 'member_added') {
      const member = act.targetTitle || 'a new team member';
      return `${actor} added **${member}** to the project${timeSuffix}.`;
    }

    if (act.message && !act.message.includes('item') && !act.message.includes('_')) {
      return `${actor} ${act.message}${timeSuffix}.`;
    }

    if (key) {
      return `${actor} updated **${key}**${title}${timeSuffix}.`;
    }

    return `${actor} performed an update on the project${timeSuffix}.`;
  }

  /**
   * Correlate multiple activities on the same ticket into a coherent narrative
   */
  static formatTicketTimeline(ticketKey, events) {
    if (events.length === 1) {
      return this.formatSingleEvent(events[0]);
    }

    // Sort chronologically ascending for timeline narration
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime()
    );

    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const title = latest.targetTitle || first.targetTitle || '';
    const titleStr = title ? ` ("${title}")` : '';

    const parts = [];

    // Check if created in this window
    const createdEvent = sorted.find((e) => (e.action || '').toLowerCase() === 'created');
    if (createdEvent) {
      const actor = createdEvent.actorName || createdEvent.actor || 'A team member';
      const timeStr = this.formatNaturalDate(createdEvent.timestamp || createdEvent.createdAt);
      const prio = createdEvent.priority || createdEvent.metadata?.priority;
      const due = createdEvent.dueDate || createdEvent.metadata?.dueDate;
      let sentence = `${actor} created **${ticketKey}**${titleStr}${timeStr ? ` on ${timeStr}` : ''}`;
      if (prio) sentence += ` with **${prio}** priority`;
      if (due) sentence += ` and a deadline of ${this.formatSimpleDate(due)}`;
      parts.push(sentence + '.');
    }

    // Check status/priority evolutions
    for (const ev of sorted) {
      if (ev === createdEvent) continue;
      const actor = ev.actorName || ev.actor || 'A team member';
      const action = (ev.action || '').toLowerCase();
      const meta = ev.metadata || {};

      if (action === 'priority_changed') {
        const toPrio = ev.newValue || ev.priority || meta.toPriority;
        if (toPrio) {
          parts.push(`${actor} adjusted its priority to **${toPrio}**.`);
        }
      } else if (action === 'status_changed') {
        const toStatus = ev.newValue || ev.status || meta.toStatus;
        if (toStatus) {
          parts.push(`${actor} moved the ticket to **${toStatus}**.`);
        }
      } else {
        parts.push(this.formatSingleEvent(ev));
      }
    }

    return parts.join(' ');
  }

  /**
   * Synthesize project intelligence risk / impact explanation
   */
  static synthesizeImpactAnalysis(activities, projectKey) {
    const risks = [];

    // Find any blocked tickets
    const blockedEvents = activities.filter((a) => {
      const status = (a.status || a.newValue || a.metadata?.toStatus || a.metadata?.status || '').toLowerCase();
      const msg = (a.message || '').toLowerCase();
      return status === 'blocked' || msg.includes('blocked');
    });

    // Find urgent/high priority changes
    const highPrioEvents = activities.filter((a) => {
      const prio = (a.priority || a.newValue || a.metadata?.toPriority || a.metadata?.priority || '').toLowerCase();
      const msg = (a.message || '').toLowerCase();
      return prio === 'urgent' || prio === 'high' || msg.includes('urgent') || msg.includes('blocker');
    });

    // Find sprint activities
    const sprintEvents = activities.filter((a) => (a.type || '').toLowerCase() === 'sprint' || (a.action || '').toLowerCase() === 'sprint_started');

    if (blockedEvents.length > 0) {
      const keys = [...new Set(blockedEvents.map((e) => e.targetKey).filter(Boolean))];
      const keysStr = keys.map((k) => `**${k}**`).join(', ');
      risks.push(
        `The most significant recent item is ${keysStr || 'a ticket'} becoming **Blocked**. If dependencies are not resolved quickly, this may increase delivery risk for the current sprint.`
      );
    } else if (highPrioEvents.length > 0) {
      const keys = [...new Set(highPrioEvents.map((e) => e.targetKey).filter(Boolean))];
      const keysStr = keys.map((k) => `**${k}**`).join(', ');
      risks.push(
        `Active prioritization is underway on high-priority item(s) (${keysStr || 'tickets'}). Team focus should ensure these items have clear assignees and unblocked paths.`
      );
    } else if (sprintEvents.length > 0) {
      risks.push(
        `Sprint progress is currently actively tracked. Overall changes indicate standard progression across planned deliverables.`
      );
    }

    return risks.join('\n\n');
  }

  /**
   * Main entrypoint: Synthesize complete, grounded, structured natural-language response
   */
  static synthesizeActivityResponse({ activities, projectKey, userQuestion = '' }) {
    const pKey = (projectKey || 'PILOT').toUpperCase();

    if (!Array.isArray(activities) || activities.length === 0) {
      return `No recent activity logs were recorded for project **${pKey}**.`;
    }

    const { ticketGroups, otherEvents } = this.correlateEvents(activities);
    const changeLines = [];

    // 1. Process correlated ticket groups
    for (const [ticketKey, events] of ticketGroups.entries()) {
      const narrative = this.formatTicketTimeline(ticketKey, events);
      const latest = events[0];
      const prio = latest.priority || latest.metadata?.toPriority || latest.metadata?.priority;
      const status = latest.status || latest.metadata?.toStatus || latest.metadata?.status;

      let badge = ticketKey;
      if (prio) badge += ` — ${prio} priority`;
      else if (status) badge += ` — ${status}`;

      changeLines.push(`- **${badge}**\n  ${narrative}`);
    }

    // 2. Process other events (sprints, team members, project settings)
    for (const ev of otherEvents) {
      const desc = this.formatSingleEvent(ev);
      const title = ev.sprintName || ev.targetTitle || 'Project Update';
      changeLines.push(`- **${title}**\n  ${desc}`);
    }

    let response = `### Recent Changes\n\n${changeLines.join('\n\n')}`;

    // 3. Add Project Intelligence / Impact Analysis section
    const impact = this.synthesizeImpactAnalysis(activities, pKey);
    if (impact) {
      response += `\n\n### What this means\n\n${impact}`;
    }

    return response;
  }
}
