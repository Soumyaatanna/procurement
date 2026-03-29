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
    content: `# Geopolitical Impact on Global Markets - 2026 Crisis

## Executive Summary
The Iran-Iraq conflict escalation is reshaping global markets with immediate impacts on energy prices, semiconductor supply chains, and defense technology investments.

## Critical Market Impacts
- **Oil Prices**: Brent crude up 35% to $88/barrel amid supply concerns
- **Shipping Routes**: Strait of Hormuz risks creating 15% premium on energy
- **Tech Supply Chains**: Middle East disruptions affecting semiconductor components
- **Defense Spending**: Global defense budgets increased 12% YoY

## Key Business Trends
- **Energy Security**: Renewed focus on alternative energy sources
- **Cybersecurity**: Critical infrastructure protection investments surging
- **Supply Chain**: Regional diversification away from Middle East dependencies
- **Risk Management**: Enterprise AI adoption for geopolitical scenario monitoring

## Market Opportunities
1. Cyber defense and critical infrastructure protection
2. Alternative energy and renewable transition acceleration
3. Regional supply chain mapping and AI analytics
4. Defense technology modernization
5. Supply chain resilience software

## Risk Factors
- Geopolitical escalation uncertainty
- Energy volatility impacting global trade
- Potential sanctions disrupting supply chains
- Insurance and logistics cost increases
- Currency fluctuations in affected regions

## Strategic Recommendations
- Diversify energy sourcing and re-examine supply chain concentration
- Increase cybersecurity investments for critical systems
- Monitor geopolitical risk indicators continuously
- Evaluate impact on sectors with Middle East exposure`,
    imageUrl: 'https://images.unsplash.com/photo-1667372335033-c42b63f543f4?w=800&h=500&fit=crop',
    sources: [
      { title: 'Reuters - Middle East Conflict Analysis', url: '#' },
      { title: 'Bloomberg - Energy Market Reports', url: '#' },
      { title: 'Goldman Sachs - Geopolitical Risk Assessment', url: '#' },
    ],
  },
  'finance-markets': {
    content: `# Global Markets Crisis Report - Iran-Iraq Conflict 2026

## Market Performance Overview
Global markets experiencing volatility due to Middle East tensions. Safe-haven assets gaining while emerging markets facing headwinds.

## Key Market Moves
- **Oil Markets**: WTI crude up 32%, driving energy stock rallies
- **Gold**: Safe-haven asset up 8% as investors seek stability
- **Emerging Markets**: Currencies weaker against USD; flight to safety
- **Defense Stocks**: Up 18% on increased government spending
- **Tech**: Down 6% due to semiconductor supply chain concerns

## Economic Impacts
1. **Inflation Pressure**: Energy costs rising 4-6% across developed economies
2. **Central Banks**: Reassessing rate policies amid economic uncertainty
3. **Insurance Costs**: Maritime and aviation premiums up 25-30%
4. **Trading Volumes**: Volatility index (VIX) at 28, elevated from 15

## Critical Sectors Under Pressure
- **Shipping & Logistics**: Supply chain delays increasing costs
- **Airlines**: Fuel surcharges and route diversions impacting margins
- **Manufacturing**: Raw material costs up 15-20%
- **Insurance**: Premium spikes for Middle East exposure

## Investment Thesis
Long-term positioning: diversification, hedging strategies, focus on resilient companies with strong balance sheets and minimal Middle East exposure.

## Watch Carefully
- Strait of Hormuz shipping incidents
- Oil production disruptions
- Sanction implementations
- Currency movements in affected regions`,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
    sources: [
      { title: 'Financial Times - Crisis Coverage', url: '#' },
      { title: 'JP Morgan - Market Analysis', url: '#' },
      { title: 'CNBC - Breaking News', url: '#' },
    ],
  },
  'startup-ecosystem': {
    content: `# 2026 Startup Landscape - Geopolitical Crisis Impact

## Funding Environment Shift
The Iran-Iraq conflict has created both challenges and opportunities for startups. Risk-aware investors are reallocating capital toward resilience-focused companies.

## Sector Opportunities Emerging
**Growing Funding Areas:**
1. **Cybersecurity & Defense Tech**: $2.4B invested in Q1 2026
2. **Supply Chain AI**: Companies mapping alternatives attracting $1.8B
3. **Energy Tech & Renewables**: Accelerated investment in energy independence
4. **Logistics & Shipping Tech**: Rerouting solutions commanding premiums
5. **Geopolitical Risk Analytics**: New category attracting enterprise spending

## Funding Trends
- **Total Q1 2026**: $28B raised (down 12% due to risk re-assessment)
- **Series B Preferred**: Investors backing companies with proven revenue
- **Geographic Shift**: Reduced focus on MENA region, increased US/EU
- **Risk Premium**: Companies with Middle East exposure facing 20-30% valuation cuts

## Startup Challenges
- Reduced risk appetite from investors
- Supply chain partners becoming unreliable
- Insurance and logistics costs surging
- Travel restrictions affecting international teams
- Uncertainty deterring venture capital

## New Opportunities
- Companies solving supply chain resilience
- Geopolitical risk monitoring platforms
- Cyber defense solutions
- Energy independence technology
- Alternative logistics networks

## Strategic Advice for Founders
- Focus on sectors benefiting from geopolitical shift
- Emphasize supply chain resilience
- Build defensible moats with government contracts
- Consider geographic diversification
- Pivot to energy security if applicable`,
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
    sources: [
      { title: 'Crunchbase - Q1 2026 Report', url: '#' },
      { title: 'PitchBook - Funding Trends Analysis', url: '#' },
      { title: 'VentureXpert - Geopolitical Impact Study', url: '#' },
    ],
  },
};

// Realistic mock news feeds
const mockFeeds: Record<string, MockFeedItem[]> = {
  'executive': [
    {
      headline: 'Oil Markets Rally on Middle East Uncertainty',
      summary: 'Brent crude jumps 35% to $88/barrel. Energy companies benefiting from supply concerns. Investors warned of further volatility ahead.',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    },
    {
      headline: 'Supply Chain Crisis: Companies Rush to Diversify',
      summary: 'Manufacturers accelerating shift away from Middle East component suppliers. Supply chain redesign costs exceeding $2B across Fortune 500.',
      imageUrl: 'https://images.unsplash.com/photo-1586282391129-76a47df1d6b3?w=400&h=300&fit=crop',
    },
    {
      headline: 'Defense Spending Surge as Nations Strengthen Military Capacity',
      summary: 'Global defense budgets up 12% for 2026. Cyber warfare capabilities and missile defense garnering largest allocations.',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop',
    },
  ],
  'investor': [
    {
      headline: 'Safe-Haven Assets Rally: Gold Up 8%, Dollar Strengthens',
      summary: 'Risk-off sentiment sending investors to traditional safe havens. Emerging market currencies weakening as capital flows to US and Europe.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    },
    {
      headline: 'Geopolitical Risk Premiums Reshape Portfolio Returns',
      summary: 'Energy stocks +18%, Defense +16%. Tech stocks down 6% on supply chain concerns. Flight to quality dominates market dynamics.',
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop',
    },
    {
      headline: 'Shipping Insurance Premiums Spike 25% as Strait of Hormuz Becomes Critical',
      summary: 'Maritime insurance costs surge amid re-routing concerns. Red Sea and Suez alternatives creating bottlenecks. Shipping indexes at 5-year highs.',
      imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=300&fit=crop',
    },
  ],
  'developer': [
    {
      headline: 'Cybersecurity Investments Soar: Critical Infrastructure Under Siege',
      summary: 'Government and enterprise spending on cyber defense exceeds $2.4B. Geopolitical cyber threats creating urgent demand for AI-driven security.',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    },
    {
      headline: 'Supply Chain Mapping AI Becomes Essential Business Tool',
      summary: 'Enterprises deploying AI to identify dependencies and risks. Companies offering supply chain visibility raising $1.8B in Series funding.',
      imageUrl: 'https://images.unsplash.com/photo-1667372335033-c42b63f543f4?w=400&h=300&fit=crop',
    },
    {
      headline: 'Geopolitical Intelligence Platforms Revolutionize Risk Analytics',
      summary: 'Real-time monitoring of geopolitical events becoming standard. APIs providing trade flow, sanctions, and shipping data attracting enterprise interest.',
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
      {
        date: 'March 2026',
        event: 'LPG Gas Shortage',
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
