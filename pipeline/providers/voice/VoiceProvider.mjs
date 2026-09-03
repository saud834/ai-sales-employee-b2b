// Interface every voice-generation provider implements.
export class VoiceProvider {
  get name() {
    throw new Error("VoiceProvider subclasses must implement get name()");
  }

  /** @returns {Promise<{provider: string, model: string, estimatedUsd: number, notes: string}>} */
  async estimateCost({ text }) {
    throw new Error(`${this.name}: estimateCost not implemented`);
  }

  /** @returns {Promise<{audioPath: string, metadata: object}>} */
  async synthesize({ text, voiceId, outputPath }) {
    throw new Error(`${this.name}: synthesize not implemented`);
  }
}
