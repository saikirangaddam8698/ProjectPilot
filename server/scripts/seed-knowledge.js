/**
 * ProjectPilot Demo Knowledge Base Seeder
 * Ingests curated markdown documentation into PostgreSQL / pgvector
 * via the real DocumentIngestionService pipeline.
 *
 * Idempotent: Skips re-ingestion if document exists with identical SHA-256 checksum.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { prisma } from '../src/db/prisma.js';
import { DocumentIngestionService } from '../src/services/knowledge/documentIngestion.service.js';
import { KnowledgeRepository } from '../src/repositories/knowledge.repository.js';
import { ProjectRepository } from '../src/repositories/project.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_DIR = path.resolve(__dirname, '../seed/knowledge');

/**
 * Infer document type from title or filename
 */
function inferDocumentType(filename, content) {
  const nameLower = filename.toLowerCase();
  const contentLower = content.toLowerCase();

  if (nameLower.includes('architecture') || contentLower.includes('architecture')) {
    return 'ARCHITECTURE';
  }
  if (nameLower.includes('api') || nameLower.includes('spec') || contentLower.includes('api specification')) {
    return 'API_SPEC';
  }
  if (nameLower.includes('deployment') || nameLower.includes('runbook') || nameLower.includes('pipeline')) {
    return 'RUNBOOK';
  }
  if (nameLower.includes('rbac') || nameLower.includes('security') || nameLower.includes('policy')) {
    return 'REQUIREMENTS';
  }
  return 'GENERAL';
}

/**
 * Extract document title from first Markdown heading or filename
 */
function extractTitle(filename, content) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match && match[1]) {
    return match[1].trim();
  }
  return path.basename(filename, '.md').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function seedKnowledgeBase() {
  console.log('\n==================================================');
  console.log('ProjectPilot RAG Knowledge Base Seeder');
  console.log('==================================================');

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Knowledge seed directory not found at: ${KNOWLEDGE_DIR}`);
    return { success: false, reason: 'Directory not found' };
  }

  // 1. Ensure admin member m-1 exists for attribution (Document.createdById references Member.id)
  let adminMember = await prisma.member.findFirst();

  const uploadedById = adminMember ? adminMember.id : 'm-1';
  console.log(`Ingesting documents as member: ${adminMember ? adminMember.name : 'System Admin'} (${uploadedById})`);

  const projectDirs = fs.readdirSync(KNOWLEDGE_DIR).filter(f => {
    return fs.statSync(path.join(KNOWLEDGE_DIR, f)).isDirectory();
  });

  let totalFiles = 0;
  let totalIngested = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const projectKey of projectDirs) {
    const projectPath = path.join(KNOWLEDGE_DIR, projectKey);
    const project = await ProjectRepository.findByKey(projectKey);

    if (!project) {
      console.warn(`\n[WARN] Project key "${projectKey}" not found in database. Skipping folder.`);
      continue;
    }

    console.log(`\nProcessing Project Workspace: ${project.name} (${projectKey}) [ID: ${project.id}]`);
    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      totalFiles++;
      const filePath = path.join(projectPath, file);
      const textContent = fs.readFileSync(filePath, 'utf8');
      const title = extractTitle(file, textContent);
      const checksum = crypto.createHash('sha256').update(textContent).digest('hex');
      const documentType = inferDocumentType(file, textContent);

      // Check existing document in project
      const existingDocs = await prisma.document.findMany({
        where: {
          projectId: project.id,
          title
        }
      });

      const exactMatch = existingDocs.find(d => d.checksum === checksum && d.status === 'READY');

      if (exactMatch) {
        const chunkCount = await prisma.documentChunk.count({ where: { documentId: exactMatch.id } });
        console.log(`  └─ [SKIP] "${title}" already indexed & READY (${chunkCount} chunks, checksum: ${checksum.slice(0, 8)})`);
        totalSkipped++;
        continue;
      }

      // If document exists with outdated checksum or FAILED status, clean it up before re-ingesting
      for (const oldDoc of existingDocs) {
        console.log(`  └─ [REINDEX] Removing outdated document record ID ${oldDoc.id}...`);
        await KnowledgeRepository.deleteDocument(oldDoc.id).catch(() => {});
      }

      // Ingest document through real RAG ingestion pipeline
      try {
        const result = await DocumentIngestionService.ingestDocument({
          projectId: project.id,
          uploadedById,
          title,
          description: `Seeded technical documentation: ${title}`,
          documentType,
          textContent,
          fileName: file,
          mimeType: 'text/markdown'
        });

        console.log(`  └─ [SUCCESS] Ingested "${title}" → Status: ${result.status}, Chunks: ${result.chunksCount}`);
        totalIngested++;
      } catch (err) {
        console.error(`  └─ [ERROR] Failed to ingest "${title}":`, err.message);
        totalErrors++;
      }
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`Seeding Summary: Total: ${totalFiles} | Ingested: ${totalIngested} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
  console.log('==================================================\n');

  return {
    success: totalErrors === 0,
    totalFiles,
    totalIngested,
    totalSkipped,
    totalErrors
  };
}

// Allow direct CLI invocation via node scripts/seed-knowledge.js
if (process.argv[1] && process.argv[1].endsWith('seed-knowledge.js')) {
  seedKnowledgeBase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal Knowledge Base Seeding Error:', err);
      process.exit(1);
    });
}
