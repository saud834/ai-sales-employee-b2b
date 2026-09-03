export async function generateVoice({ voiceProvider, text, voiceId, outputPath }) {
  console.log(`Generating voice via ${voiceProvider.name}...`);
  const result = await voiceProvider.synthesize({ text, voiceId, outputPath });
  console.log(`  saved: ${result.audioPath}`);
  return result;
}
