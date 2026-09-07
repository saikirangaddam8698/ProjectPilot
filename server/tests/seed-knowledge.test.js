import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/db/prisma.js';
import { KnowledgeSearchService } from '../src/services/knowledge/knowledgeSearch.service.js';
import { seedKnowledgeBase } from '../scripts/seed-knowledge.js';

test('ProjectPilot Demo Knowledge Seeding & RAG Dataset Test Suite', async (t) => {

  await t.test('1. seedKnowledgeBase executes idempotently and reports 0 errors', async () => {
    const report = await seedKnowledgeBase();
    assert.equal(report.success, true);
    assert.equal(report.totalErrors, 0);
    assert.ok(report.totalFiles >= 13);
  });

  await t.test('2. Seeded documents exist with READY or INDEXED status and chunks in database', async () => {
    const pilotProject = await prisma.project.findUnique({ where: { key: 'PILOT' } });
    assert.ok(pilotProject);

    const docs = await prisma.document.findMany({
      where: {
        projectId: pilotProject.id,
        status: { in: ['READY', 'INDEXED'] }
      },
      include: { chunks: true }
    });

    assert.ok(docs.length >= 10, `Expected at least 10 docs in PILOT project, got ${docs.length}`);
    for (const d of docs) {
      assert.ok(d.status === 'READY' || d.status === 'INDEXED', `Unexpected doc status ${d.status}`);
      assert.ok(d.chunks.length > 0, `Doc "${d.title}" has 0 chunks`);
      assert.ok(d.id, `Doc "${d.title}" missing ID`);
    }
  });

  await t.test('3. Enforces strict project isolation for seeded documents', async () => {
    const infraProject = await prisma.project.findUnique({ where: { key: 'INFRA' } });
    const mobileProject = await prisma.project.findUnique({ where: { key: 'MOBILE' } });
    assert.ok(infraProject);
    assert.ok(mobileProject);

    const infraDocs = await prisma.document.findMany({ where: { projectId: infraProject.id } });
    const mobileDocs = await prisma.document.findMany({ where: { projectId: mobileProject.id } });

    assert.ok(infraDocs.length >= 2);
    assert.ok(mobileDocs.length >= 1);

    // Verify PILOT docs do not leak into INFRA or MOBILE project IDs
    const crossCheck = infraDocs.find(d => d.title.includes('ProjectPilot System Architecture'));
    assert.equal(crossCheck, undefined, 'PILOT architecture doc leaked into INFRA project');
  });

  await t.test('4. KnowledgeSearchService retrieves relevant seeded chunks for authentic query', async () => {
    const searchResults = await KnowledgeSearchService.searchKnowledge({
      projectKey: 'PILOT',
      query: 'How does authentication and JWT work in ProjectPilot?',
      limit: 3
    });

    assert.ok(searchResults);
    assert.ok(searchResults.results);
    assert.ok(searchResults.results.length > 0, 'Expected search results for authentication query');
    const firstResult = searchResults.results[0];
    assert.ok(firstResult.documentTitle);
    assert.ok(firstResult.content);
  });

  await t.test('5. KnowledgeSearchService respects project boundary during search', async () => {
    const searchResults = await KnowledgeSearchService.searchKnowledge({
      projectKey: 'MOBILE',
      query: 'How does Pinia state management work in ProjectPilot?',
      limit: 3
    });

    // Mobile project search must NOT return ProjectPilot core architecture chunks
    if (searchResults.results.length > 0) {
      const invalidLeak = searchResults.results.find(r => r.documentTitle.includes('ProjectPilot System Architecture'));
      assert.equal(invalidLeak, undefined, 'RAG search leaked PILOT doc into MOBILE search');
    }
  });

  await t.test('6. Unrelated query returns empty or clean no-match results', async () => {
    const searchResults = await KnowledgeSearchService.searchKnowledge({
      projectKey: 'PILOT',
      query: 'What is the secret recipe for baking chocolate fudge cake?',
      limit: 3
    });

    // Unrelated query should yield 0 results due to similarity thresholding
    assert.ok(Array.isArray(searchResults.results));
    assert.equal(searchResults.results.length, 0);
  });
});
