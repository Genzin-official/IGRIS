import React from 'react';
import { Code, Lightbulb, GraduationCap, Compass, ArrowUpRight } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function PromptSuggestions({ onSelectPrompt }: PromptSuggestionsProps) {
  const suggestions = [
    {
      title: 'Analyze & Optimize Code',
      desc: 'Review a React/TypeScript component for performance and clean patterns.',
      icon: Code,
      prompt: 'Review this TypeScript code and suggest architectural enhancements, focusing on safety, type completeness, and standard React 18+ conventions.',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      title: 'Brainstorm App Ideas',
      desc: 'Formulate highly innovative product mechanics and features for a modern web application.',
      icon: Lightbulb,
      prompt: 'I want to build a highly creative and original SaaS application. Help me brainstorm 3 core concepts with distinct feature layouts and design aesthetics.',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Explain Complex Science',
      desc: 'Translate complex mathematical or physics topics into elegant conceptual models.',
      icon: GraduationCap,
      prompt: 'Explain Quantum Superposition and Entanglement using elegant physical analogies suitable for a curious student.',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Refine Strategic Writing',
      desc: 'Draft structured content with a highly articulate, persuasive, and stately tone.',
      icon: Compass,
      prompt: 'Help me draft an elegant pitch letter to a group of seed investors for a sustainable deep-tech startup. Ensure the language is highly refined and professional.',
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full mt-10 px-4" id="prompt-suggestions-container">
      {suggestions.map((item, index) => {
        return (
          <button
            key={index}
            id={`prompt-suggestion-${index}`}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex flex-col justify-between p-4 border border-gray-100 rounded-2xl hover:border-black/10 hover:bg-gray-50 bg-white text-left transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-1 focus:ring-black/20"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-black transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200">
              <ArrowUpRight className="w-3.5 h-3.5 text-black" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
