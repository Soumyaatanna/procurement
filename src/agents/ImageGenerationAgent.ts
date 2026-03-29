import firebaseAI from "../utils/firebaseAI";

/**
 * Generate optimized image prompt using Gemini AI
 * Creates detailed, descriptive prompts that work better with image generation
 */
const generateImagePrompt = async (topic: string): Promise<string> => {
  const promptGeneration = `Create a detailed, vivid image generation prompt for: "${topic}"
  
Requirements:
- Style: Animated cartoon, Disney/Pixar style, family-friendly
- Include specific visual elements, colors, composition details
- Be concise but descriptive (30-50 words)
- Focus on business/professional themes with visual appeal
- No people or faces unless essential
- Example format: "A vibrant cartoon illustration of [subject] with [colors] background, [style], [mood]"

Return ONLY the image prompt, nothing else.`;

  try {
    const optimizedPrompt = await firebaseAI.generateText(promptGeneration, false);
    return optimizedPrompt.trim();
  } catch (error) {
    console.warn('Failed to generate AI prompt, using basic prompt instead');
    return createBasicPrompt(topic);
  }
};

/**
 * Create a basic cartoon prompt if AI generation fails
 */
const createBasicPrompt = (topic: string): string => {
  const prompts: Record<string, string> = {
    'AI': 'Vibrant cartoon illustration of artificial intelligence with glowing circuit boards, digital waves, bright futuristic colors',
    'energy': 'Colorful animated cartoon of renewable energy sources: solar panels, wind turbines, and flowing electrical waves',
    'market': 'Cartoon illustration of business growth charts with upward arrows, stock tickers, and financial data visualization',
    'war': 'Editorial cartoon style illustration of conflict resolution, with diplomatic symbols and bridges',
    'trade': 'Animated cartoon of global commerce showing ships, containers, and international trade routes',
    'tech': 'Vibrant cartoon tech scene with servers, data centers, and digital innovation elements',
    'supply chain': 'Cartoon illustration of supply chain network with connected nodes, logistics hubs, and global connections',
    'defense': 'Cartoon illustration of security shield protecting digital infrastructure, tech defense systems',
  };

  // Find best match
  const topic_lower = topic.toLowerCase();
  for (const [key, prompt] of Object.entries(prompts)) {
    if (topic_lower.includes(key)) {
      return prompt;
    }
  }

  // Default prompt
  return `Vibrant animated cartoon illustration of "${topic}" in professional style, bright colors, clean bright background, Disney-Pixar inspired`;
};

/**
 * Generate cartoon-style image using Pollinations API
 * First generates optimized prompt with Gemini, then uses Pollinations for rendering
 */
export const generateImage = async (prompt: string) => {
  try {
    // Step 1: Generate optimized prompt using Gemini AI
    console.log('🎨 Generating optimized image prompt with Gemini AI...');
    let optimizedPrompt: string;
    
    try {
      optimizedPrompt = await generateImagePrompt(prompt);
      console.log('✓ AI Prompt generated:', optimizedPrompt.substring(0, 100) + '...');
    } catch (error) {
      console.warn('AI prompt generation failed, using basic prompt');
      optimizedPrompt = createBasicPrompt(prompt);
    }

    // Step 2: Add cartoon style enhancements to the prompt
    const enhancedPrompt = `${optimizedPrompt}. Ultra high quality, professional cartoon art style, vivid colors, no photorealism, animated illustration`;

    // Step 3: Use Pollinations API to generate the image
    const pollinationsUrl = import.meta.env.VITE_POLLINATIONS_API_URL || 'https://image.pollinations.ai/prompt/';
    const url = `${pollinationsUrl}${encodeURIComponent(enhancedPrompt)}`;
    
    console.log('🖼️  Generating image from Pollinations API...');
    return url;
  } catch (error) {
    console.error('Image generation error:', error);
    // Return a fallback placeholder or generic cartoon style URL
    const pollinationsUrl = import.meta.env.VITE_POLLINATIONS_API_URL || 'https://image.pollinations.ai/prompt/';
    const fallbackPrompt = `Vibrant cartoon business illustration of ${prompt}, professional style, bright colors`;
    return `${pollinationsUrl}${encodeURIComponent(fallbackPrompt)}`;
  }
};
