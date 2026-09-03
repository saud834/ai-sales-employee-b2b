export async function generateVideo({
  videoProvider,
  prompt,
  imagePath,
  durationSeconds,
  aspectRatio,
  outputPath,
}) {
  console.log(`Generating video via ${videoProvider.name} (this can take a couple of minutes)...`);
  const result = imagePath
    ? await videoProvider.generateFromImage({ imagePath, prompt, durationSeconds, aspectRatio, outputPath })
    : await videoProvider.generateFromText({ prompt, durationSeconds, aspectRatio, outputPath });
  console.log(`  saved: ${result.videoPath}`);
  return result;
}
