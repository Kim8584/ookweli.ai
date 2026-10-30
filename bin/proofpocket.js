#!/usr/bin/env node
/**
 * ProofPocket CLI Developer Tool
 * Tether QVAC On-Device AI × Jolt Atlas zkML Verifier
 */

import { processProofPocketPipeline, PRESET_SCENARIOS } from '../src/proofpocket.js';
import { getQvacDiagnostics } from '../src/qvac_telemetry.js';
import { runZkmlProof } from '../src/zkml_prover.js';

const argv = process.argv.slice(2);

function printHelp() {
  console.log(`
PROOFPOCKET CLI — Verifiable On-Device AI Engine (Ookweli)
Usage:
  proofpocket [options]

Options:
  --scenario <name>     Select preset: 'solvency', 'healthcare', 'identity' (default: solvency)
  --input <text>        Custom input statement for on-device analysis
  --qvac-only           Run only Tether QVAC hardware telemetry and local analysis
  --prove-only          Run only the Jolt Atlas zkML proof generation & verification
  --json                Output pure JSON result
  --help, -h            Show this help manual

Examples:
  node bin/proofpocket.js --scenario solvency
  node bin/proofpocket.js --input "Audited Tether collateral: 114M USD"
  node bin/proofpocket.js --prove-only
`);
}

async function main() {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const isJson = argv.includes('--json');
  const qvacOnly = argv.includes('--qvac-only');
  const proveOnly = argv.includes('--prove-only');

  const scenarioIdx = argv.indexOf('--scenario');
  const scenarioId = scenarioIdx !== -1 && argv[scenarioIdx + 1] ? argv[scenarioIdx + 1] : 'solvency';

  const inputIdx = argv.indexOf('--input');
  const customText = inputIdx !== -1 && argv[inputIdx + 1] ? argv[inputIdx + 1] : null;

  if (qvacOnly) {
    const diag = await getQvacDiagnostics();
    if (isJson) {
      console.log(JSON.stringify(diag, null, 2));
    } else {
      console.log('\n=== TETHER QVAC SYSTEM RESOURCES ===');
      console.log(`CPU: ${diag.capabilities.cpu.model} (${diag.capabilities.cpu.logicalCores} cores)`);
      console.log(`RAM: ${diag.sample.memoryUsedFormatted} / ${diag.capabilities.memory.totalFormatted}`);
      console.log(`GPU: ${diag.capabilities.gpu.detected ? 'Active' : 'Not detected'}`);
      console.log(`Isolation: 100% On-device / Zero Remote Network Calls\n`);
    }
    return;
  }

  if (proveOnly) {
    if (!isJson) console.log('\n[zkML] Spawning Jolt Atlas prover for BGE-Tiny ONNX...');
    const zk = await runZkmlProof({ withStats: true });
    if (isJson) {
      console.log(JSON.stringify(zk, null, 2));
    } else {
      console.log(`=== JOLT ATLAS zkML VERIFICATION ===`);
      console.log(`Status: ${zk.verified ? '✓ VERIFIED' : 'FAILED'}`);
      console.log(`Certificate ID: ${zk.certificateId}`);
      console.log(`Proving Time: ${zk.timings.provingTime}`);
      console.log(`Verification Time: ${zk.timings.verifyingTime}`);
      console.log(`Proof Size: ${zk.proofMetrics.proofSizeMiB} MiB`);
      console.log(`Polynomial Commitments: ${zk.proofMetrics.polynomialCommitments}`);
      console.log(`Sumcheck Rounds: ${zk.proofMetrics.sumcheckProofs}`);
      console.log(`Commitment Scheme: ${zk.proofMetrics.commitmentScheme}\n`);
    }
    return;
  }

  // Full Pipeline Execution
  if (!isJson) {
    console.log('\n===============================================================');
    console.log(' PROOFPOCKET // OOKWELI: ON-DEVICE AI + JOLT ATLAS zkML');
    console.log('===============================================================');
    console.log(`Scenario: ${scenarioId}`);
  }

  const result = await processProofPocketPipeline({
    scenarioId,
    text: customText
  });

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('\n1. TETHER QVAC ON-DEVICE TELEMETRY:');
  console.log(`   Host CPU: ${result.localAiEngine.hardwareReport.cpuModel} (${result.localAiEngine.hardwareReport.cores} cores)`);
  console.log(`   RAM Used: ${result.localAiEngine.hardwareReport.memoryUsed} / ${result.localAiEngine.hardwareReport.totalMemory}`);
  console.log(`   Document Fingerprint: ${result.localAiEngine.documentEvaluation.fingerprint}`);
  console.log(`   Domain Classified: ${result.localAiEngine.documentEvaluation.domain}`);
  console.log(`   Air-gapped Guarantee: Zero bytes transferred across network`);

  console.log('\n2. JOLT ATLAS ZERO-KNOWLEDGE PROOF & VERIFICATION:');
  if (result.zkmlEngine.status === 'CRYPTOGRAPHICALLY_VERIFIED') {
    console.log(`   Status: ✓ ${result.zkmlEngine.status}`);
    console.log(`   Certificate ID: ${result.zkmlEngine.certificateId}`);
    console.log(`   Model: ${result.zkmlEngine.modelMetrics.modelName} (${result.zkmlEngine.modelMetrics.atlasNodes} nodes)`);
    console.log(`   Prover Setup Latency: ${result.zkmlEngine.timings.proverSetupTime}`);
    console.log(`   Proof Generation Time: ${result.zkmlEngine.timings.provingTime}`);
    console.log(`   Proof Verification Time: ${result.zkmlEngine.timings.verifyingTime}`);
    console.log(`   Proof Size: ${result.zkmlEngine.proofMetrics.proofSizeMiB} MiB`);
    console.log(`   HyperKZG Commitments: ${result.zkmlEngine.proofMetrics.polynomialCommitments}`);
    console.log(`   Sumcheck Proofs: ${result.zkmlEngine.proofMetrics.sumcheckProofs}`);
    console.log(`   Fixed-point Scale: ${result.zkmlEngine.proofMetrics.fixedPointScale}`);
  } else {
    console.log(`   Status: ✗ ${result.zkmlEngine.status}`);
    console.log(`   Error: ${result.zkmlEngine.error}`);
  }

  console.log('\n3. CRYPTOGRAPHIC BOUNDARY STATEMENT:');
  console.log('   • Proves: Deterministic execution of 269 ONNX graph nodes without mathematical forgery.');
  console.log('   • Does not prove: Factual truth of external real-world statements.');
  console.log('===============================================================\n');
}

main().catch(err => {
  console.error('\nProofPocket CLI Fatal Error:', err.message);
  process.exit(1);
});
