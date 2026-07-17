export type Role = 'user' | 'assistant' | 'system';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  modelUsed?: string;
  grounding?: GroundingMetadata;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  capabilities: string[];
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'IGRIS Core (3.5 Flash)',
    description: 'High-speed, smart general-purpose model. Ideal for text composition, basic reasoning, and general chat.',
    isPremium: false,
    capabilities: ['Fast response', 'Web Search Grounding', 'Code assistance'],
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'IGRIS Elite (3.1 Pro)',
    description: 'Deep reasoning, advanced coding, and complex analysis. (Requires Premium API key selection)',
    isPremium: true,
    capabilities: ['Deep coding', 'Mathematical reasoning', 'Logical analysis'],
  },
];
