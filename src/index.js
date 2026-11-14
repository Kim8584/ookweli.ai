/**
 * Ookweli / ProofPocket Primary Library Entrypoint
 */

export { processProofPocketPipeline, PRESET_SCENARIOS } from './proofpocket.js';
export { getQvacDiagnostics, analyzeDocumentLocally } from './qvac_telemetry.js';
export { runZkmlProof } from './zkml_prover.js';
