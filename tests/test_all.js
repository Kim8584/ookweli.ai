/**
 * Comprehensive Automated Test Suite for ProofPocket / Ookweli
 * Tests QVAC on-device AI integration, Jolt Atlas zkML proving/verification,
 * offline air-gapped readiness, and error boundaries.
 */

import { getQvacDiagnostics, analyzeDocumentLocally } from '../src/qvac_telemetry.js';
import { runZkmlProof } from '../src/zkml_prover.js';
import { processProofPocketPipeline } from '../src/proofpocket.js';
import { WdkPaymentBridge } from '../src/wdk_bridge.js';
import { WalletAiGuardian } from '../src/wallet_guardian.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log(' PROOFPOCKET / OOKWELI AUTOMATED TEST SUITE');
  console.log(' Target: AI Yako Hackathon Submission Verification');
  console.log('===============================================================\n');

  // Test Suite 1: Tether QVAC SDK Integration & System Telemetry
  console.log('[SUITE 1] Testing Tether QVAC On-Device Telemetry & Hardware Engine...');
  const qvacDiag = await getQvacDiagnostics();
  assert(qvacDiag !== null, 'QVAC telemetry returned a non-null diagnostic report');
  assert(qvacDiag.qvacAvailable === true, 'QVAC SDK initialized successfully via Bare runtime');
  assert(qvacDiag.capabilities.cpu.logicalCores >= 1, `Host CPU cores detected (${qvacDiag.capabilities.cpu.logicalCores} cores)`);
  assert(qvacDiag.capabilities.memory.totalBytes > 0, `Host memory capability detected (${qvacDiag.capabilities.memory.totalFormatted})`);
  assert(qvacDiag.provenance.source.includes('QVAC'), 'Telemetry provenance verified to originate from Tether QVAC SDK');

  // Test Suite 2: Local Privacy & Air-gapped Semantic Processing
  console.log('\n[SUITE 2] Testing Air-Gapped Local Semantic Analysis...');
  const sampleDoc = 'USDT Liquid Reserves: 114M USD audited collateral ratio 104.8%';
  const docAnalysis = analyzeDocumentLocally(sampleDoc, 'solvency');
  assert(docAnalysis.processedLocally === true, 'Document marked as processed strictly locally');
  assert(docAnalysis.privacyPreserved === true, 'Privacy preservation assertion verified');
  assert(docAnalysis.fingerprint.startsWith('0x'), `Deterministic fingerprint generated (${docAnalysis.fingerprint})`);
  assert(docAnalysis.domain.includes('Financial Solvency'), `Domain accurately classified (${docAnalysis.domain})`);

  const targetedDoc = 'High-intent B2B audience demographic with 0.95 conversion intent and low churn risk';
  const targetedAnalysis = analyzeDocumentLocally(targetedDoc, 'targeted_ai');
  assert(targetedAnalysis.domain.includes('Targeted AI'), `Targeted AI audience domain identified (${targetedAnalysis.domain})`);

  // Test Suite 3: Jolt Atlas zkML Prover & Verifier (Level 1 Verification)
  console.log('\n[SUITE 3] Testing Jolt Atlas zkML Prover & Cryptographic Verifier (Level 1)...');
  const zkResult = await runZkmlProof({ withStats: true });
  assert(zkResult !== null, 'zkML prover returned valid execution receipt');
  assert(zkResult.verified === true, 'Cryptographic proof verified successfully by verifier');
  assert(zkResult.proofMetrics.polynomialCommitments === 912, `HyperKZG polynomial commitments count confirmed (${zkResult.proofMetrics.polynomialCommitments})`);
  assert(zkResult.proofMetrics.sumcheckProofs === 114, `Multilinear sumcheck proofs count confirmed (${zkResult.proofMetrics.sumcheckProofs})`);
  assert(zkResult.proofMetrics.proofSizeMiB > 0, `Proof size reported accurately (${zkResult.proofMetrics.proofSizeMiB} MiB)`);
  assert(zkResult.modelMetrics.atlasNodes === 269, `ONNX model graph lowered to 269 Atlas nodes`);
  assert(zkResult.certificateId.startsWith('0x'), `Unique cryptographic certificate issued (${zkResult.certificateId})`);

  // Test Suite 4: End-to-End ProofPocket Pipeline Integration
  console.log('\n[SUITE 4] Testing Integrated ProofPocket Pipeline...');
  const pipelineResult = await processProofPocketPipeline({ scenarioId: 'solvency' });
  assert(pipelineResult.appName.includes('ProofPocket'), 'Pipeline reports correct application identity');
  assert(pipelineResult.localAiEngine.status === 'ONLINE_LOCAL', 'Local AI engine status verified ONLINE_LOCAL');
  assert(pipelineResult.zkmlEngine.status === 'CRYPTOGRAPHICALLY_VERIFIED', 'zkML status verified CRYPTOGRAPHICALLY_VERIFIED');
  assert(pipelineResult.offlineStatus.isFullyAirGappedCapable === true, 'Offline air-gap capability certified');

  // Test Suite 5: Error Boundaries & Input Validation
  console.log('\n[SUITE 5] Testing Error Boundaries & Missing Model Handling...');
  try {
    await runZkmlProof({ modelPath: 'models/non_existent_model' });
    assert(false, 'Should have thrown error on non-existent model');
  } catch (err) {
    assert(err.message.includes('not found'), `Handled missing model gracefully: ${err.message}`);
  }

  // Test Suite 6: Tether WDK Payment Escrow Settlement
  console.log('\n[SUITE 6] Testing Tether WDK Payment Escrow Bridge...');
  const bridge = new WdkPaymentBridge({ vaultBalance: 10000 });
  const escrow = bridge.createAttestationEscrow({
    recipient: '0x99A...testVault',
    amount: 2500,
    requiredModelHash: 'bge-tiny:atlas269',
    conditionDescription: 'Solvency check > 100%'
  });
  assert(escrow.escrowId.startsWith('wdk_escrow_'), `WDK Escrow created (${escrow.escrowId})`);

  const payout = bridge.verifyAndExecutePayout(escrow, pipelineResult);
  assert(payout.settled === true, `WDK Payout successfully unlocked by verified zkML attestation (${payout.amount} USDt)`);
  assert(payout.txHash.startsWith('0x'), `WDK settlement transaction hash generated (${payout.txHash})`);
  assert(bridge.vaultBalance === 7500, `Vault balance reduced correctly (Remaining: ${bridge.vaultBalance} USDt)`);

  // Test Suite 7: On-Device Wallet AI Guardian
  console.log('\n[SUITE 7] Testing On-Device Wallet AI Guardian Security Engine...');
  const guardian = new WalletAiGuardian({ maxDailyLimitUSDt: 1000 });
  const safeTx = guardian.evaluateTransaction({
    to: '0x1234567890123456789012345678901234567890',
    amountUSDt: 250,
    isContract: false
  });
  assert(safeTx.decision === 'APPROVE', `Normal transaction safely approved (Risk score: ${safeTx.riskScore})`);

  const drainerTx = guardian.evaluateTransaction({
    to: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    amountUSDt: 5000,
    isContract: true,
    calldata: '0xsetApprovalForAll'
  });
  assert(drainerTx.decision === 'BLOCK', `Wallet drainer blocked successfully (Risk score: ${drainerTx.riskScore})`);
  assert(drainerTx.riskFlags.length >= 2, `Multiple risk indicators triggered (${drainerTx.riskFlags.length} flags)`);
  assert(drainerTx.evaluatedLocally === true, 'Wallet AI security evaluation ran 100% locally on-device');

  // Summary
  console.log('\n===============================================================');
  console.log(` TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  if (failedTests === 0) {
    console.log(' STATUS: ALL TESTS PASSED — SUBMISSION READY (LEVEL 1 IDEAL)');
  } else {
    console.log(' STATUS: SOME TESTS FAILED');
  }
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
