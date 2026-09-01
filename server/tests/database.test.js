import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma, checkDatabaseHealth } from '../src/db/prisma.js';
import { ProjectRepository } from '../src/repositories/project.repository.js';
import { TicketRepository } from '../src/repositories/ticket.repository.js';
import { SprintRepository } from '../src/repositories/sprint.repository.js';
import { MemberRepository } from '../src/repositories/member.repository.js';
import { ActivityRepository } from '../src/repositories/activity.repository.js';
import { DatabaseService } from '../src/services/database.service.js';
import { ProjectService } from '../src/services/project.service.js';
import { TicketService } from '../src/services/ticket.service.js';
import { SprintService } from '../src/services/sprint.service.js';
import { MemberService } from '../src/services/member.service.js';
import { ActivityService } from '../src/services/activity.service.js';
import { SEED_MEMBERS, SEED_PROJECTS, SEED_SPRINTS, SEED_TICKETS, SEED_ACTIVITIES } from '../prisma/seed.js';

test('ProjectPilot Database Foundation & Layered Architecture Tests', async (t) => {
  await t.test('Prisma Client singleton and checkDatabaseHealth are defined', async () => {
    assert.ok(prisma);
    assert.ok(typeof checkDatabaseHealth === 'function');
    const health = await checkDatabaseHealth();
    assert.ok(health.status === 'connected' || health.status === 'disconnected');
    assert.equal(health.provider, 'postgresql');
    assert.ok(typeof health.latencyMs === 'number');
  });

  await t.test('DatabaseService returns structured health verification payload', async () => {
    const res = await DatabaseService.verifyHealth();
    assert.ok(res.status === 'connected' || res.status === 'disconnected');
    assert.equal(res.provider, 'postgresql');
    assert.ok(res.timestamp);
    assert.ok(typeof res.latencyMs === 'number');
  });

  await t.test('Seed dataset has deterministic and complete domain data', async () => {
    assert.equal(SEED_MEMBERS.length, 6);
    assert.equal(SEED_PROJECTS.length, 3);
    assert.equal(SEED_SPRINTS.length, 7);
    assert.equal(SEED_TICKETS.length, 16);
    assert.equal(SEED_ACTIVITIES.length, 7);

    // Verify key projects
    const keys = SEED_PROJECTS.map((p) => p.key);
    assert.ok(keys.includes('PILOT'));
    assert.ok(keys.includes('INFRA'));
    assert.ok(keys.includes('MOBILE'));

    // Verify team members
    const alex = SEED_MEMBERS.find((m) => m.id === 'm-1');
    assert.equal(alex.name, 'Alex Morgan');
    assert.equal(alex.email, 'alex.m@projectpilot.dev');
  });

  await t.test('Repository and Service classes export required data-access methods', async () => {
    // Project Layer
    assert.ok(typeof ProjectRepository.findAll === 'function');
    assert.ok(typeof ProjectRepository.findByKey === 'function');
    assert.ok(typeof ProjectService.getAllProjects === 'function');
    assert.ok(typeof ProjectService.getProjectByKey === 'function');

    // Ticket Layer
    assert.ok(typeof TicketRepository.findAll === 'function');
    assert.ok(typeof TicketRepository.findByKey === 'function');
    assert.ok(typeof TicketRepository.reassignMemberTickets === 'function');
    assert.ok(typeof TicketService.getAllTickets === 'function');

    // Sprint Layer
    assert.ok(typeof SprintRepository.findAll === 'function');
    assert.ok(typeof SprintRepository.findActiveSprint === 'function');
    assert.ok(typeof SprintService.getAllSprints === 'function');

    // Member Layer
    assert.ok(typeof MemberRepository.findAll === 'function');
    assert.ok(typeof MemberRepository.findByEmail === 'function');
    assert.ok(typeof MemberService.getAllMembers === 'function');

    // Activity Layer
    assert.ok(typeof ActivityRepository.findAll === 'function');
    assert.ok(typeof ActivityRepository.createActivity === 'function');
    assert.ok(typeof ActivityService.getAllActivities === 'function');
  });
});
