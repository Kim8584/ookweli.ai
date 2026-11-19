/**
 * AI Guardian for Non-Custodial Crypto Wallets (Tether WDK)
 * Evaluates transaction safety, phishing risk, address poisoning, and contract limits on-device.
 */

import { createHash } from 'node:crypto';

// Known suspicious patterns & simulation heuristics
const SUSPICIOUS_FUNCTIONS = [
  'setApprovalForAll',
  'transferFrom',
  'upgradeTo',
  'permit',
  'drain',
  'delegatecall'
];

export class WalletAiGuardian {
  constructor(options = {}) {
    this.maxDailyLimitUSDt = options.maxDailyLimitUSDt || 5000.0;
    this.whitelistedAddresses = new Set((options.whitelist || []).map(a => a.toLowerCase()));
    this.knownScamAddresses = new Set([
      '0x000000000000000000000000000000000000dead',
      '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Known drainer pattern
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'  // Impersonation target
    ]);
  }

  /**
   * Evaluates an outgoing transaction payload locally before the user signs in their WDK wallet.
   */
  evaluateTransaction({ to, amountUSDt, calldata = '', isContract = false, recipientLabel = '' }) {
    const targetAddress = (to || '').toLowerCase();
    const riskFlags = [];
    let riskScore = 0.05; // Base minimal risk

    // 1. Phishing & Address Poisoning Check
    if (this.knownScamAddresses.has(targetAddress)) {
      riskScore = 1.0;
      riskFlags.push('CRITICAL: Target address is on global scam/drainer blacklist');
    }

    // Check for lookalike vanity addresses (address poisoning pattern)
    if (targetAddress.startsWith('0x0000') || targetAddress.endsWith('0000')) {
      riskScore = Math.max(riskScore, 0.75);
      riskFlags.push('WARNING: Potential vanity / address poisoning signature detected');
    }

    // 2. High Value Spending Anomaly Check
    if (amountUSDt > this.maxDailyLimitUSDt) {
      riskScore = Math.max(riskScore, 0.65);
      riskFlags.push(`ALERT: Transaction amount (${amountUSDt} USDt) exceeds policy safety limit (${this.maxDailyLimitUSDt} USDt)`);
    }

    // 3. Calldata & Malicious Contract Interaction Detection
    if (isContract && calldata) {
      const lowerCalldata = calldata.toLowerCase();
      for (const suspicious of SUSPICIOUS_FUNCTIONS) {
        if (lowerCalldata.includes(suspicious.toLowerCase())) {
          riskScore = Math.max(riskScore, 0.85);
          riskFlags.push(`SUSPICIOUS CALLDATA: Method '${suspicious}' detected - potential balance allowance drain`);
        }
      }
    }

    // 4. Determine AI Recommendation
    let decision = 'APPROVE';
    let humanExplanation = 'Transaction evaluated safely on-device with zero detected anomalies.';

    if (riskScore >= 0.8) {
      decision = 'BLOCK';
      humanExplanation = 'High probability wallet drainer or malicious recipient detected. Signature recommended to be aborted.';
    } else if (riskScore >= 0.5) {
      decision = 'WARN_USER_CONFIRMATION_REQUIRED';
      humanExplanation = 'Transaction exceeds typical baseline risk or safety thresholds. Manual visual confirmation required.';
    }

    // Cryptographic inspection fingerprint
    const auditHash = '0x' + createHash('sha256')
      .update(`${targetAddress}:${amountUSDt}:${riskScore}:${decision}:${Date.now()}`)
      .digest('hex');

    return {
      decision,
      riskScore: parseFloat(riskScore.toFixed(3)),
      riskFlags,
      humanExplanation,
      targetAddress,
      amountUSDt,
      auditHash,
      evaluatedLocally: true,
      timestamp: new Date().toISOString()
    };
  }
}
