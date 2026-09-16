import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TicketService } from '../src/services/ticket.service.js';

test('ProjectPilot Ticket Comments Persistence & History Test Suite', async (t) => {
  await t.test('TicketService.getTicketByKey returns comments array', async () => {
    const ticket = await TicketService.getTicketByKey('PILOT-104');
    assert.ok(ticket, 'Ticket PILOT-104 exists');
    assert.ok(Array.isArray(ticket.comments), 'comments is an array');
    assert.ok(ticket.comments.length >= 1, 'contains at least one comment');

    const firstComment = ticket.comments[0];
    assert.ok(firstComment.text.includes('@Priya Patel'), 'comment text matches Alex message');
    assert.ok(firstComment.createdAt, 'comment has createdAt date/time');
    assert.ok(firstComment.author, 'comment has author');
    assert.equal(firstComment.author.name, 'Alex Morgan');
  });

  await t.test('TicketService.addComment appends new comment with timestamp and persists to DB', async () => {
    const newCommentText = `@Priya Patel testing verification comments at ${Date.now()}`;
    const result = await TicketService.addComment('PILOT-104', {
      text: newCommentText,
      author: {
        id: 'm-1',
        name: 'Alex Morgan',
        avatar: 'AM',
        role: 'Project Admin'
      }
    });

    assert.ok(result.comment, 'returned new comment object');
    assert.equal(result.comment.text, newCommentText);
    assert.ok(result.comment.createdAt, 'has createdAt timestamp');
    assert.ok(result.ticket.comments.some((c) => c.text === newCommentText), 'ticket includes comment');

    // Re-fetch from DB to verify true persistence
    const reloaded = await TicketService.getTicketByKey('PILOT-104');
    assert.ok(reloaded.comments.some((c) => c.text === newCommentText), 'comment persisted across DB reads');

    // Clean up test comment
    const originalOnly = reloaded.comments.filter((c) => c.text !== newCommentText);
    await TicketService.updateTicket('PILOT-104', { comments: originalOnly });
  });
});
