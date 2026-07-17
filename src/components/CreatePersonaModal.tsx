import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { CustomPersona, AVAILABLE_MODELS } from '../types';

interface CreatePersonaModalProps {
  onClose: () => void;
  onCreate: (persona: Omit<CustomPersona, 'id'>) => void;
}

const PRESET_EMOJIS = [
  '⚔️', '🏛️', '💻', '🔮', '🧠', '🎨', '🛡️', '🦁', '🤖', '🐉', '🛸', '👽', '📈', '🩺', '✍️', '👩‍💻', '🔥', '🌟', '🍿', '🔍'
];

export default function CreatePersonaModal({ onClose, onCreate }: CreatePersonaModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧠');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [greeting, setGreeting] = useState('');
  
  // Custom prompt suggestions
  const [suggestion1, setSuggestion1] = useState('');
  const [suggestion2, setSuggestion2] = useState('');
  const [suggestion3, setSuggestion3] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an elegant name for this intelligence.');
      return;
    }
    if (!systemInstruction.trim()) {
      setError('System instructions are required to define the core behavioral matrix.');
      return;
    }

    const promptSuggestions = [suggestion1, suggestion2, suggestion3]
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onCreate({
      name: name.trim(),
      emoji,
      description: description.trim(),
      systemInstruction: systemInstruction.trim(),
      temperature,
      model,
      greeting: greeting.trim() || undefined,
      promptSuggestions: promptSuggestions.length > 0 ? promptSuggestions : undefined,
      isCustom: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="create-persona-modal-overlay">
      <div 
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        id="create-persona-modal"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-black text-white rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Assemble Custom Intelligence</h2>
              <p className="text-xs text-slate-500">Configure core behaviors, parameters, and aesthetics.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-black transition-colors"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" id="create-persona-form">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-gray-100 pb-1.5">
              1. Visual & Name Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Intelligence Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Code Architect"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Selected Avatar: {emoji}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value.substring(0, 4))}
                    placeholder="🧠"
                    maxLength={4}
                    className="w-full text-center text-lg bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Quick Emoji selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Select Avatar</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                {PRESET_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      emoji === e ? 'bg-black text-white scale-110 shadow-sm' : 'hover:bg-gray-200 text-slate-700'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Short Biography / Core Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A senior software architect designed to refactor and optimize database scaling..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Section 2: Instructions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-gray-100 pb-1.5">
              2. Core Directives & Instructions
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">System Instruction Matrix</label>
                <span className="text-[10px] text-slate-500">Dictates personality, style, and tone</span>
              </div>
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="You are Socrates, a classical Athenian philosopher. Never answer questions directly. Instead, ask probing questions that challenge premises..."
                rows={4}
                className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Starting greeting (Optional)</label>
                <span className="text-[10px] text-slate-500">Posted immediately on blank sessions</span>
              </div>
              <input
                type="text"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Welcome, traveler. State your prompt and let us explore together."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Section 3: Parameters */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-gray-100 pb-1.5">
              3. Intelligence Configuration Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Host Engine Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isPremium ? '(Premium)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="block text-xs font-bold text-slate-700">Creativity / Temp: {temperature.toFixed(1)}</label>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    {temperature <= 0.3 ? 'Precise' : temperature <= 0.8 ? 'Balanced' : 'Highly Creative'}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <span className="text-[10px] text-slate-400 font-bold">0.0</span>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="flex-1 accent-black h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">2.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Prompt Suggestions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-gray-100 pb-1.5">
              4. Hotstart Prompts & Suggestions (Optional)
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Custom Prompt Suggestions</label>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={suggestion1}
                  onChange={(e) => setSuggestion1(e.target.value)}
                  placeholder="Suggestion 1: e.g. Audit my database configuration"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                />
                <input
                  type="text"
                  value={suggestion2}
                  onChange={(e) => setSuggestion2(e.target.value)}
                  placeholder="Suggestion 2: e.g. Refactor my code for scale"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                />
                <input
                  type="text"
                  value={suggestion3}
                  onChange={(e) => setSuggestion3(e.target.value)}
                  placeholder="Suggestion 3: e.g. Design a robust security architecture"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#111111] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-slate-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all"
          >
            Cancel Selection
          </button>
          <button
            type="submit"
            form="create-persona-form"
            className="px-5 py-2 bg-black hover:bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all"
          >
            Deploy Intelligence Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
