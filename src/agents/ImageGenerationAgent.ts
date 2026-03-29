export const generateImage = async (prompt: string) => {
  const cartoonPrompt = `Vibrant animated cartoon illustration of: ${prompt}. Style: Disney/Pixar-inspired, colorful, playful, cheerful, professional quality. Features: clean bold lines, expressive characters, bright vibrant colors, dynamic composition, high-quality 3D cartoon rendering. No photorealistic elements.`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cartoonPrompt)}`;
  return url;
};
