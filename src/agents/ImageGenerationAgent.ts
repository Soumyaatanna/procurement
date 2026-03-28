export const generateImage = async (prompt: string) => {
  const cartoonPrompt = `Vibrant, high-quality 3D cartoon style illustration of: ${prompt}. Professional character design, expressive, clean lines, bright colors.`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cartoonPrompt)}`;
  return url;
};
