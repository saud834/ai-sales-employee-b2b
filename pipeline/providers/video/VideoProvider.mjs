// Interface every video-generation provider implements. Plain JS "abstract
// class" - no TS build step, keeps this pipeline dependency-free.
export class VideoProvider {
  /** Human-readable name for logs/metadata.json. */
  get name() {
    throw new Error("VideoProvider subclasses must implement get name()");
  }

  /**
   * Free/cheap: return a cost estimate WITHOUT generating anything.
   * @returns {Promise<{provider: string, model: string, estimatedUsd: number, notes: string}>}
   */
  async estimateCost({ durationSeconds, aspectRatio }) {
    throw new Error(`${this.name}: estimateCost not implemented`);
  }

  /**
   * Text -> video.
   * @returns {Promise<{videoPath: string, metadata: object}>}
   */
  async generateFromText({ prompt, durationSeconds, aspectRatio, outputPath }) {
    throw new Error(`${this.name}: generateFromText not implemented`);
  }

  /**
   * Image (+ prompt) -> video. Second mode, per spec - optional to implement.
   * @returns {Promise<{videoPath: string, metadata: object}>}
   */
  async generateFromImage({ imagePath, prompt, durationSeconds, aspectRatio, outputPath }) {
    throw new Error(`${this.name}: generateFromImage not implemented (image-to-video not supported by this provider)`);
  }
}
