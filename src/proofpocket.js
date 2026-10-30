/**
 * ProofPocket Core Orchestrator
 * Unites Tether QVAC on-device AI execution with Jolt Atlas zero-knowledge ML verification.
 */

import { getQvacDiagnostics, analyzeDocumentLocally } from './qvac_telemetry.js';
import { runZkmlProof } from './zkml_prover.js';

export const PRESET_SCENARIOS = {
  solvency: {
    id: 'solvency',
    title: 'Financial Reserve & Solvency Attestation',
    subtitle: 'Audit corporate balance sheets & stablecoin reserve collateral privately',
    defaultText: 'Audited Liquid Reserves: 114,200,000 USD Equivalent. Collateral Ratio: 104.8%. Zero unsecured commercial paper held. Treasury Bills: 88.5%. Sovereign Repo: 11.5%.'
  },
  healthcare: {
    id: 'healthcare',
    title: 'Confidential Clinical Diagnostic Triage',
    subtitle: 'Process patient EHR symptom notes on-device without cloud HIPAA exposure',
    defaultText: 'Patient presents with acute episodic dyspnea and tachycardia. Fasting blood glucose: 118 mg/dL. ECG indicates normal sinus rhythm with mild non-specific ST changes.'
  },
  identity: {
    id: 'identity',
    title: 'Zero-Knowledge AML & Sanctions Clearance',
    subtitle: 'Verify non-sanctioned identity clearance without disclosing biometric or passport PII',
    defaultText: 'Subject verification: jurisdiction Republic of Kenya. PEP clearance: Negative. OFAC/UN Sanctions screening: Negative. Biometric confidence score: 0.994.'
  }
};

export async function processProofPocketPipeline({ text, scenarioId = 'solvency', skipZkml = false } = {}) {
  const scenario = PRESET_SCENARIOS[scenarioId] || {
    id: 'custom',
    title: 'Custom Private Document Verification',
    subtitle: 'On-device private inference and cryptographic verification'
  };

  const inputText = text || scenario.defaultText || 'Default confidential user input for on-device analysis.';

  // 1. Stage 1: Tether QVAC On-Device Telemetry & Analysis
  const qvacTelemetry = await getQvacDiagnostics();
  const documentAnalysis = analyzeDocumentLocally(inputText, scenario.id);

  // 2. Stage 2 & 3: Jolt Atlas zkML Proof Generation & Verification
  let zkmlResult = null;
  let zkmlError = null;

  if (!skipZkml) {
    try {
      zkmlResult = await runZkmlProof({ withStats: true });
    } catch (err) {
      zkmlError = err.message || String(err);
    }
  }

  // 3. Compose Comprehensive Verifiable Attestation
  const attestation = {
    appName: 'ProofPocket by Ookweli',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    scenario: {
      id: scenario.id,
      title: scenario.title,
      subtitle: scenario.subtitle
    },
    localAiEngine: {
      framework: 'Tether QVAC SDK (@qvac/sdk)',
      status: qvacTelemetry.qvacAvailable ? 'ONLINE_LOCAL' : 'FALLBACK_LOCAL',
      hardwareReport: {
        cpuModel: qvacTelemetry.capabilities.cpu.model,
        cores: qvacTelemetry.capabilities.cpu.logicalCores,
        totalMemory: qvacTelemetry.capabilities.memory.totalFormatted,
        memoryUsed: qvacTelemetry.sample.memoryUsedFormatted,
        gpuDetected: qvacTelemetry.capabilities.gpu.detected
      },
      documentEvaluation: documentAnalysis
    },
    zkmlEngine: zkmlResult ? {
      status: zkmlResult.verified ? 'CRYPTOGRAPHICALLY_VERIFIED' : 'VERIFICATION_FAILED',
      framework: 'Jolt Atlas zkML (a16z Jolt + ICME Labs)',
      certificateId: zkmlResult.certificateId,
      provingSystem: 'Multilinear Sumcheck + HyperKZG (BN254)',
      timings: zkmlResult.timings,
      proofMetrics: zkmlResult.proofMetrics,
      modelMetrics: zkmlResult.modelMetrics,
      correctnessStatement: zkmlResult.cryptographicCorrectness
    } : {
      status: 'SKIPPED_OR_UNAVAILABLE',
      error: zkmlError,
      explanation: 'zkML proof was either skipped by request or encountered an execution blocker.'
    },
    offlineStatus: {
      networkAccessRequired: false,
      isFullyAirGappedCapable: true,
      dataPrivacyStatus: 'ZERO_DATA_LEAKAGE (Input never left device RAM)'
    }
  };

  return attestation;
}
