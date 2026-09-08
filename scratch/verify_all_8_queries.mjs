import { AiAgentService } from '../server/src/services/ai.service.js';
import { generateAuthToken } from '../server/src/utils/token.js';

const adminUser = {
  id: 'u-1',
  email: 'alex.m@projectpilot.dev',
  role: 'ADMIN',
  memberId: 'm-1'
};

const testQueries = [
  { id: 1, prompt: "What changed recently in this project?", desc: "Natural timeline using real actor names, ticket keys, titles, dates and actions" },
  { id: 2, prompt: "How is the current sprint doing?", desc: "Natural sprint analysis with progress, interpretation and risk" },
  { id: 3, prompt: "Why is PILOT-104 blocked?", desc: "Correlate ticket + activity + sprint/dependency evidence" },
  { id: 4, prompt: "What are the biggest risks in the current sprint?", desc: "Multi-tool reasoning and prioritization" },
  { id: 5, prompt: "Give me an executive summary of this project.", desc: "Concise executive-level project intelligence" },
  { id: 6, prompt: "How does authentication work?", desc: "Natural RAG-grounded explanation" },
  { id: 7, prompt: "How does project RBAC prevent cross-project access?", desc: "Natural RAG-grounded security explanation" },
  { id: 8, prompt: "What is the recipe for chocolate cake?", desc: "No fabrication / insufficient project evidence response" }
];

async function run() {
  console.log('=== PROJECTPILOT NATURAL-LANGUAGE INTELLIGENCE VERIFICATION ===\n');

  for (const q of testQueries) {
    console.log(`\n======================================================`);
    console.log(`TEST QUERY ${q.id}: "${q.prompt}"`);
    console.log(`GOAL: ${q.desc}`);
    console.log(`------------------------------------------------------`);
    try {
      const res = await AiAgentService.chat({
        projectKey: 'PILOT',
        message: q.prompt,
        user: adminUser
      });

      console.log('AI RESPONSE:\n');
      console.log(res.message);
      console.log('\nANALYSIS / INTELLIGENCE METADATA:');
      console.log(JSON.stringify(res.analysis, null, 2));
      console.log(`EVALUATION VALID: ${res.evaluator?.valid}, GROUNDED: ${res.evaluator?.grounded}`);
    } catch (err) {
      console.error('ERROR executing query:', err.message);
    }
  }
}

run().then(() => {
  console.log('\n=== VERIFICATION COMPLETED ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
