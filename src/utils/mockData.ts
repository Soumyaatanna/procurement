/**
 * Mock Data Provider
 * Provides realistic business news data when API quota is exceeded
 * Includes images and fallback content
 */

export interface MockBriefing {
  content: string;
  imageUrl: string;
  sources: Array<{ title: string; url: string }>;
}

export interface MockFeedItem {
  headline: string;
  summary: string;
  imageUrl: string;
}

export interface MockEntity {
  name: string;
  summary: string;
  imageUrl: string;
  marketPosition: string;
  recentNews: string[];
}

// Realistic mock business briefings
const mockBriefings: Record<string, MockBriefing> = {
  'technology-ai': {
    content: `# Artificial Intelligence Market Insights

## Executive Summary
The AI market continues explosive growth with enterprise adoption accelerating.

## Key Trends
- **Generative AI Integration**: Companies integrating AI into core business processes
- **Enterprise Spending**: B2B AI spending increased 35% YoY
- **Regulatory Environment**: New AI governance frameworks emerging globally
- **Talent Competition**: AI talent commanding premium salaries (40-50% above market)

## Market Opportunities
1. AI infrastructure and cloud services
2. Industry-specific AI solutions
3. AI safety and compliance tools
4. AI talent and training services

## Risk Factors
- Regulatory uncertainty in key markets
- Talent shortage driving up costs
- Competition from open-source alternatives
- Economic slowdown impact on enterprise spending

## Recommendations
- Monitor regulatory developments in US, EU, and Asia
- Evaluate AI vendors for compliance and security
- Plan for talent retention and training
- Consider hybrid in-house and cloud AI strategies`,
    imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8730f17a10a3de47b5affd70d?w=800&h=500&fit=crop',
    sources: [
      { title: 'TechCrunch - AI Investment Trends 2024', url: '#' },
      { title: 'McKinsey - AI Capstone Report', url: '#' },
      { title: 'Gartner - AI Market Analysis', url: '#' },
    ],
  },
  'finance-markets': {
    content: `# Finance Markets Overview

## Market Performance
Global equity markets show mixed signals with divergent regional trends.

## Key Market Moves
- **US Markets**: S&P 500 up 12% YTD on AI enthusiasm
- **Tech Sector**: Leading gains driven by AI chip manufacturers
- **Interest Rates**: Fed on Hold, futures show stability
- **Emerging Markets**: Growing opportunities in Asia-Pacific

## Economic Indicators
1. Inflation moderating to 3.2% (down from 5.4%)
2. Unemployment at historic lows (3.7%)
3. Business confidence index up 15%
4. Consumer spending resilient

## Investment Themes
- AI and automation leaders
- Renewable energy transition
- Healthcare innovation
- Financial technology

## Watch List
- Semiconductor supply chain
- Commercial real estate valuations
- Bank lending standards
- Energy market volatility

## Strategic Actions
Monitor portfolio positioning for potential rate cuts in Q4 2024.`,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
    sources: [
      { title: 'Bloomberg - Market Analysis', url: '#' },
      { title: 'Financial Times - Weekly Update', url: '#' },
      { title: 'Reuters - Economic Calendar', url: '#' },
    ],
  },
  'startup-ecosystem': {
    content: `# Startup Ecosystem Report

## Funding Environment
Startup funding recovering with focus on profitable growth.

## Funding Metrics
- **Total Raised**: $32B in Q1 2024 (up 22% QoQ)
- **Average Series A**: $8.5M (stable)
- **Median Runway**: 18 months (healthier than 2022)
- **Success Rate**: Improved as founders focus on unit economics

## Hot Sectors
1. **AI Infrastructure**: Generative AI tooling and platforms
2. **Climate Tech**: Carbon capture and monitoring
3. **Biotech**: Precision medicine and drug discovery
4. **Fintech**: Embedded finance and SMB banking

## Investor Trends
- Focus on profitability over growth
- Increased due diligence on unit economics
- More founder-friendly valuations
- Geographic diversification beyond SF/NYC

## Challenges
- Market selectivity (best companies thriving)
- Slower exit environment
- Increased competition for talent
- Higher customer acquisition costs

## Opportunities for Entrepreneurs
- Raising is still possible for strong teams with market traction
- Customer-centric business models preferred
- International expansion opportunities
- Open positions for experienced operators`,
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
    sources: [
      { title: 'Crunchbase - Startup Database', url: '#' },
      { title: 'PitchBook - Market Report', url: '#' },
      { title: 'VentureXpert - Analytics', url: '#' },
    ],
  },
};

// Realistic mock news feeds
const mockFeeds: Record<string, MockFeedItem[]> = {
  'executive': [
    {
      headline: 'AI Drives Enterprise Software Spending to Record Highs',
      summary: 'Enterprise software budgets exceed $500B annually with AI tooling accounting for 23% growth. Companies prioritizing implementation over experimentation.',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    },
    {
      headline: 'Global Supply Chain Stabilization Boosts Margins',
      summary: 'Manufacturing lead times return to pre-pandemic levels. Inventory normalization expected to improve corporate profitability in H2 2024.',
      imageUrl: 'https://images.unsplash.com/photo-1586282391129-76a47df1d6b3?w=400&h=300&fit=crop',
    },
    {
      headline: 'Cybersecurity Budget Allocations Shift to AI-Driven Defense',
      summary: 'Zero-trust architecture adoption accelerates. Security spending expected to grow 12% annually through 2026 as breaches increase.',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop',
    },
  ],
  'investor': [
    {
      headline: 'Venture Capital Returns to Profitability Focus',
      summary: 'VCs shifting portfolio strategy to companies with clear paths to profitability. Average Series A valuation down 15% from 2021 peaks.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    },
    {
      headline: 'Tech IPO Market Revives with Strong Demand',
      summary: 'First tech IPOs of 2024 show strong institutional demand. Market expected to see 40-50 IPOs by year-end.',
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop',
    },
    {
      headline: 'Cross-Border Acquisitions Accelerate in Asia',
      summary: 'M&A activity up 28% in APAC region. Tech and healthcare drivers of consolidation wave.',
      imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=300&fit=crop',
    },
  ],
  'developer': [
    {
      headline: 'Open Source AI Models Challenge Commercial Vendors',
      summary: 'Community-driven models achieving 95% parity with commercial offerings. Cost savings driving enterprise adoption.',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    },
    {
      headline: 'Cloud Infrastructure Costs Optimization Becomes Priority',
      summary: 'Engineering teams report 35% efficiency gains through workload optimization. FinOps becoming critical skill.',
      imageUrl: 'https://images.unsplash.com/photo-1667372335033-c42b63f543f4?w=400&h=300&fit=crop',
    },
    {
      headline: 'API Economy Matures with Security Standards',
      summary: 'New API governance frameworks standardize authentication and rate limiting. Security-first approach becoming industry norm.',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop',
    },
  ],
};

// Mock entity details
const mockEntities: Record<string, MockEntity> = {
  'NVIDIA': {
    name: 'NVIDIA Corporation',
    summary: `Leading AI infrastructure provider dominating GPU market. Market cap exceeded $1T in 2024. Strong Y/Y growth in data center segment.
    
**Key Metrics:**
- Revenue: $60.9B (FY2024)
- Data Center Revenue: $47.0B (77% of total)
- Gross Margin: 75.1% (highest in semiconductor industry)
- Stock Performance: Up 218% in 2024

**Recent Developments:**
- Announced Blackwell architecture with 5x performance improvement
- Expanded partnerships with major cloud providers
- Increased capital allocation for R&D in AI chips`,
    imageUrl: 'https://images.unsplash.com/photo-1627873649417-af36141a5347?w=400&h=300&fit=crop',
    marketPosition: 'Market Leader - AI Infrastructure',
    recentNews: [
      'Blackwell GPU architecture announcement',
      'Record quarterly earnings beat',
      'New partnerships with enterprise cloud providers',
      'Expansion of manufacturing capacity',
    ],
  },
  'OpenAI': {
    name: 'OpenAI',
    summary: `Creator of GPT models and ChatGPT. Valued at $80B+ in late 2024. Raised $6.6B in Series C funding.
    
**Key Achievements:**
- ChatGPT: 200M+ weekly active users
- 10,000+ enterprise customers
- Revenue: $3.4B annual run rate
- 70% of Fortune 500 using OpenAI products

**Strategic Focus:**
- Scaling model training and inference
- Enterprise product development
- Safety and alignment research
- International expansion`,
    imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8730f17a10a3de47b5affd70d?w=400&h=300&fit=crop',
    marketPosition: 'Category Leader - Generative AI',
    recentNews: [
      'GPT-4.5 model announcement',
      'Enterprise deployment expansion',
      'New partnerships with Stripe, Notion',
      'Investment in API infrastructure scaling',
    ],
  },
  'Tesla': {
    name: 'Tesla Inc.',
    summary: `EV market leader with diversified energy business including solar and battery storage.
    
**Market Position:**
- EV Market Share: 19% globally, 55% in US
- Energy Storage: Fastest growing segment (40% YoY)
- Market Cap: $800B+
- Locations: 50 countries, 1000+ Superchargers

**Key Metrics FY2024:**
- Revenue: $81.5B (+22% YoY)
- Vehicle Deliveries: 1.81M units
- Gross Margin: 25.1%
- Operating Margin: 10.2%

**Recent Highlights:**
- Cybertruck production ramping up
- New battery technology announcements
- Expansion in energy services
- AI autonomous driving features`,
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a63c5-c283?w=400&h=300&fit=crop',
    marketPosition: 'Market Leader - Electric Vehicles',
    recentNews: [
      'Cybertruck production acceleration',
      'New battery manufacturing facility',
      'Autonomous driving beta expansion',
      'Energy business segment growth',
    ],
  },
};

/**
 * Get mock briefing by topic
 */
export const getMockBriefing = (persona: string, topic: string): MockBriefing => {
  // Match topic to mock briefing
  const topicLower = topic.toLowerCase();
  let key = 'technology-ai';
  
  if (topicLower.includes('finance') || topicLower.includes('market') || topicLower.includes('stock')) {
    key = 'finance-markets';
  } else if (topicLower.includes('startup') || topicLower.includes('venture') || topicLower.includes('fundrais')) {
    key = 'startup-ecosystem';
  }
  
  return mockBriefings[key] || mockBriefings['technology-ai'];
};

/**
 * Get mock feed by persona
 */
export const getMockFeed = (persona: string, interests: string[]): MockFeedItem[] => {
  const personaLower = persona.toLowerCase();
  let key = 'executive';
  
  if (personaLower.includes('investor') || personaLower.includes('vc')) {
    key = 'investor';
  } else if (personaLower.includes('developer') || personaLower.includes('engineer')) {
    key = 'developer';
  }
  
  return mockFeeds[key] || mockFeeds['executive'];
};

/**
 * Get mock entity details
 */
export const getMockEntity = (entity: string): MockEntity => {
  const entityUpper = entity.toUpperCase();
  return mockEntities[entityUpper] || mockEntities['NVIDIA'];
};

/**
 * Get mock podcast script
 */
export const getMockPodcastScript = (topic: string, persona: string): string => {
  return `
**[Intro Music - 5 seconds]**

**Host Alex:** Welcome to Business Brief Daily! I'm Alex Chen, and today we're discussing ${topic} with a focus on what it means for ${persona}s.

**Host Sam:** That's right! ${topic} has been making headlines lately, and we've got some exciting developments to break down.

**Host Alex:** Let's start with the numbers. The market for ${topic} is projected to grow 25% annually through 2026.

**Host Sam:** And what's driving that growth?

**Host Alex:** Several factors really. First, enterprise adoption is accelerating. Companies are allocating more budget to ${topic} initiatives. Second, we're seeing new entrants disrupting traditional players.

**Host Sam:** That's fascinating. What should our audience be paying attention to?

**Host Alex:** Three key things:
1. Watch for regulatory developments - governments are creating new frameworks
2. The talent situation - companies are competing hard for skilled people
3. Integration challenges - choosing the right tools and vendors is crucial

**Host Sam:** And where are the opportunities?

**Host Alex:** For ${persona}s specifically, there are several angle to explore. Companies need strategic partners, implementation expertise, and ongoing support.

**Host Sam:** What about risks?

**Host Alex:** Market consolidation could limit options. Technology lock-in is a real concern. And unforeseen regulations could reshape the playing field.

**Host Sam:** Final thoughts?

**Host Alex:** Start planning now. The window to shape ${topic} strategy is open, but it won't stay that way forever.

**[Outro Music - 5 seconds]**

**Hosts (together):** Thanks for listening to Business Brief Daily! Subscribe for tomorrow's episode.
  `.trim();
};

/**
 * Get mock story segment
 */
export const getMockStorySegment = (topic: string): { story: string; imagePrompt: string } => {
  return {
    story: `**The ${topic} Revolution**

Tech leaders just announced a breakthrough that could reshape the industry. After months of development, the team's innovative approach challenges conventional thinking.

Market watchers are closely monitoring adoption. Early indicators show strong interest among enterprise customers and investors.

**Impact Assessment:**
- Enterprise adoption expected to accelerate
- New competitive dynamics emerging
- Investment opportunities opening up
- Talent recruitment intensifying

**What Happens Next:** The coming quarters will reveal whether this represents genuine disruption or temporary market enthusiasm.`,
    imagePrompt: `${topic} innovation, professional business illustration, modern office, digital transformation, vibrant colors`,
  };
};

/**
 * Get mock story arc
 */
export const getMockStoryArc = (topic: string): any => {
  return {
    title: `The ${topic} Evolution: 12-Month Story Arc`,
    timeline: [
      {
        date: 'May 2024',
        event: 'Market disruption announcement',
        sentiment: 0.7,
        price: 450,
        details: 'Initial launch generates significant buzz',
      },
      {
        date: 'Jul 2024',
        event: 'Enterprise adoption accelerates',
        sentiment: 0.8,
        price: 620,
        details: 'Fortune 500 companies begin pilot programs',
      },
      {
        date: 'Sep 2024',
        event: 'Funding round closes',
        sentiment: 0.75,
        price: 580,
        details: '$200M Series C funding secured at $2B valuation',
      },
      {
        date: 'Dec 2024',
        event: 'Competitive response',
        sentiment: 0.6,
        price: 640,
        details: 'Incumbent players announce competing solutions',
      },
      {
        date: 'Mar 2025',
        event: 'Market consolidation',
        sentiment: 0.65,
        price: 750,
        details: 'Strategic partnerships and acquisition talks',
      },
      {
        date: 'May 2025',
        event: 'Industry standardization',
        sentiment: 0.75,
        price: 850,
        details: 'Industry groups establish best practices',
      },
    ],
    keyPlayers: [
      'Innovation leaders',
      'Enterprise customers',
      'Incumbent competitors',
      'Regulatory bodies',
      'Venture capital investors',
      'Strategic partnerships',
    ],
    predictions: [
      'Market consolidation will accelerate in 2025',
      'New regulatory frameworks will emerge',
      'Enterprise adoption projected to reach 65% by 2026',
      'Pricing pressure will increase competition',
      'International expansion will be key differentiator',
    ],
  };
};

/**
 * Generate mock image from Unsplash API fallback
 */
export const getMockImage = (topic: string, width: number = 400, height: number = 300): string => {
  const topics: Record<string, string> = {
    'technology': 'technology',
    'ai': 'artificial-intelligence',
    'finance': 'finance',
    'stock': 'stock-market',
    'startup': 'startup',
    'business': 'business',
    'news': 'news',
  };
  
  const topicLower = topic.toLowerCase();
  let searchTerm = 'business';
  
  for (const [key, value] of Object.entries(topics)) {
    if (topicLower.includes(key)) {
      searchTerm = value;
      break;
    }
  }
  
  // Return Unsplash image placeholder
  return `https://images.unsplash.com/photo-1552664730-d307ca884978?w=${width}&h=${height}&fit=crop`;
};

export default {
  getMockBriefing,
  getMockFeed,
  getMockEntity,
  getMockPodcastScript,
  getMockStorySegment,
  getMockStoryArc,
  getMockImage,
};
