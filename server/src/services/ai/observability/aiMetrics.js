/**
 * Task 16 — AI Metrics
 * In-memory telemetry metrics aggregator for AI operations.
 * Tracks performance counters, token usage, latency averages, and grounding rates.
 */

export class AiMetrics {
  static #totalRequests = 0;
  static #successfulRequests = 0;
  static #failedRequests = 0;
  static #totalTokens = 0;
  static #totalLatencyMs = 0;
  static #geminiInvocations = 0;
  static #ragInvocations = 0;
  static #toolExecutions = 0;
  static #groundedResponses = 0;
  static #ungroundedResponses = 0;

  static recordRequest() {
    this.#totalRequests++;
  }

  static recordSuccess() {
    this.#successfulRequests++;
  }

  static recordFailure() {
    this.#failedRequests++;
  }

  static recordTokens(count = 0) {
    if (typeof count === 'number' && count > 0) {
      this.#totalTokens += count;
    }
  }

  static recordLatency(ms = 0) {
    if (typeof ms === 'number' && ms > 0) {
      this.#totalLatencyMs += ms;
    }
  }

  static recordGeminiInvocation(count = 1) {
    this.#geminiInvocations += count;
  }

  static recordToolExecution(count = 1) {
    this.#toolExecutions += count;
  }

  static recordRagInvocation(count = 1) {
    this.#ragInvocations += count;
  }

  static recordGroundedResponse(isGrounded = false) {
    if (isGrounded) {
      this.#groundedResponses++;
    } else {
      this.#ungroundedResponses++;
    }
  }

  /**
   * Return a snapshot of accumulated AI metrics
   * @returns {object}
   */
  static getSnapshot() {
    const successRate = this.#totalRequests > 0
      ? Math.round((this.#successfulRequests / this.#totalRequests) * 100) / 100
      : 0;

    const failureRate = this.#totalRequests > 0
      ? Math.round((this.#failedRequests / this.#totalRequests) * 100) / 100
      : 0;

    const avgLatencyMs = this.#successfulRequests > 0
      ? Math.round(this.#totalLatencyMs / this.#successfulRequests)
      : 0;

    return {
      totalRequests: this.#totalRequests,
      successfulRequests: this.#successfulRequests,
      failedRequests: this.#failedRequests,
      successRate,
      failureRate,
      totalTokens: this.#totalTokens,
      avgLatencyMs,
      geminiInvocations: this.#geminiInvocations,
      ragInvocations: this.#ragInvocations,
      toolExecutions: this.#toolExecutions,
      groundedResponses: this.#groundedResponses,
      ungroundedResponses: this.#ungroundedResponses
    };
  }

  /**
   * Reset metrics counters (for test isolation)
   */
  static reset() {
    this.#totalRequests = 0;
    this.#successfulRequests = 0;
    this.#failedRequests = 0;
    this.#totalTokens = 0;
    this.#totalLatencyMs = 0;
    this.#geminiInvocations = 0;
    this.#ragInvocations = 0;
    this.#toolExecutions = 0;
    this.#groundedResponses = 0;
    this.#ungroundedResponses = 0;
  }
}
