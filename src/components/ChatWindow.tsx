import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingMetadata } from '../types';
import { parseMarkdown, formatInlineStyles } from '../utils';
import { Send, Sparkles, User, Globe, ExternalLink, Copy, Check, Info, AlertTriangle, ArrowDown } from 'lucide-react';
import PromptSuggestions from './PromptSuggestions';

interface ChatWindowProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  activeModelId: string;
  onSendMessage: (content: string) => void;
}

export default function ChatWindow({
  messages,
  isGenerating,
  activeModelId,
  onSendMessage,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Handle scroll detection for "Scroll to bottom" helper button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show button if user is scrolled up more than 300px
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render search grounding sources
  const renderGrounding = (grounding?: GroundingMetadata) => {
    if (!grounding || !grounding.groundingChunks || grounding.groundingChunks.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-black">
          <Globe className="w-3.5 h-3.5" />
          <span>Web Sources:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {grounding.groundingChunks.map((chunk, idx) => {
            if (!chunk.web) return null;
            return (
              <a
                key={idx}
                href={chunk.web.uri}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-black/10 transition-all duration-200 text-xs text-slate-600 group shadow-sm"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold block truncate text-slate-800 group-hover:text-black">
                    {chunk.web.title}
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                    {chunk.web.uri}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-black transition-colors" />
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  // Render dynamic rich content blocks (headings, paragraphs, code blocks, lists)
  const renderMessageContent = (content: string, messageId: string) => {
    const blocks = parseMarkdown(content);

    return (
      <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-200">
        {blocks.map((block, bIdx) => {
          const uniqueBlockId = `${messageId}-b-${bIdx}`;

          switch (block.type) {
            case 'heading': {
              const Tag = `h${Math.min(block.level || 3, 6)}` as React.ElementType;
              const sizeClasses = 
                block.level === 1 ? 'text-xl md:text-2xl font-bold text-slate-800 dark:text-white mt-6 mb-3' :
                block.level === 2 ? 'text-lg md:text-xl font-bold text-slate-800 dark:text-white mt-5 mb-2' :
                'text-base md:text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2';
              return (
                <Tag key={uniqueBlockId} className={`${sizeClasses} tracking-tight`}>
                  {formatInlineStyles(block.content)}
                </Tag>
              );
            }

            case 'code': {
              const isCopied = copiedId === uniqueBlockId;
              return (
                <div key={uniqueBlockId} className="my-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 font-mono shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-slate-400 text-xs select-none">
                    <span className="font-semibold tracking-wider uppercase text-slate-300">{block.language || 'code'}</span>
                    <button
                      onClick={() => handleCopyText(block.content, uniqueBlockId)}
                      className="flex items-center gap-1 hover:text-slate-200 text-slate-400 transition-colors py-0.5 px-2 rounded hover:bg-slate-800"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs md:text-sm text-slate-100 max-w-full leading-relaxed">
                    <code>{block.content}</code>
                  </pre>
                </div>
              );
            }

            case 'list': {
              const Tag = block.listType === 'ordered' ? 'ol' : 'ul';
              const listClasses = block.listType === 'ordered' ? 'list-decimal pl-5' : 'list-disc pl-5';
              return (
                <Tag key={uniqueBlockId} className={`${listClasses} space-y-1.5 my-3`}>
                  {block.items?.map((item, iIdx) => (
                    <li key={`${uniqueBlockId}-${iIdx}`} className="text-slate-800 dark:text-slate-200">
                      {formatInlineStyles(item)}
                    </li>
                  ))}
                </Tag>
              );
            }

            case 'paragraph':
            default: {
              // Check if paragraph is error text
              const isSystemError = content.startsWith('An elegant system error has occurred') || content.includes('GEMINI_API_KEY');
              if (isSystemError) {
                return (
                  <div key={uniqueBlockId} className="flex gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300 text-sm my-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-semibold">System Configuration Interrupted</p>
                      <p className="mt-1 opacity-90">{block.content}</p>
                    </div>
                  </div>
                );
              }
              return (
                <p key={uniqueBlockId} className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                  {formatInlineStyles(block.content)}
                </p>
              );
            }
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FFFFFF] relative overflow-hidden font-sans" id="chat-window-viewport">
      {/* Header */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white z-10 select-none">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>IGRIS Intellect</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span className="text-black">{activeModelId === 'gemini-3.5-flash' ? 'Core v3.5' : 'Elite v3.1'}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 py-1 px-2.5 rounded-full text-[10px] font-bold text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active</span>
          </div>
        </div>
      </header>

      {/* Messages Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
        id="messages-scroll-area"
      >
        {messages.length === 0 ? (
          /* Blank state: Noble Greeting dashboard */
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto w-full px-4 py-8 select-none" id="welcome-dashboard">
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
              <div className="w-8 h-8 border-4 border-white rotate-45"></div>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">
              What's on your mind?
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              IGRIS is ready to assist with high-fidelity coding, strategic writing, and complex logic.
            </p>

            <PromptSuggestions onSelectPrompt={onSendMessage} />
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto w-full" id="messages-list-wrapper">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <div
                  key={message.id}
                  id={`msg-${message.id}`}
                  className={`flex gap-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Left Avatar for Assistant */}
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-sm shrink-0 font-semibold text-xs select-none">
                      <div className="w-3 h-3 border border-white rotate-45"></div>
                    </div>
                  )}

                  {/* Message Bubble container */}
                  <div className={`max-w-[85%] flex flex-col gap-1.5`}>
                    <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
                      <span className={isAssistant ? 'text-[#A38A67]' : 'text-gray-500'}>{isAssistant ? 'IGRIS' : 'Sovereign'}</span>
                      <span>•</span>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isAssistant && message.modelUsed && (
                        <>
                          <span>•</span>
                          <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wide">
                            {message.modelUsed}
                          </span>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-5 rounded-2xl ${
                        isAssistant
                          ? 'bg-[#FCFAF7] border border-[#EADFC9] border-l-4 border-l-[#C5A880] text-[#1C1A17] shadow-sm'
                          : 'bg-black border-none text-white'
                      }`}
                    >
                      {/* Rich Content rendering */}
                      {isAssistant ? (
                        renderMessageContent(message.content, message.id)
                      ) : (
                        <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      )}

                      {/* Web Grounding metadata display */}
                      {isAssistant && renderGrounding(message.grounding)}
                    </div>
                  </div>

                  {/* Right Avatar for User */}
                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-slate-700 shrink-0 select-none font-bold text-xs">
                      JD
                    </div>
                  )}
                </div>
              );
            })}

            {/* Simulated active streaming loading indicator */}
            {isGenerating && (
              <div className="flex gap-4 justify-start animate-fade-in" id="streaming-indicator">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 border border-white rotate-45 animate-spin"></div>
                </div>
                <div className="max-w-[85%] flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
                    <span className="text-[#A38A67] font-extrabold">IGRIS</span>
                    <span>•</span>
                    <span className="text-[#C5A880] animate-pulse">Drafting...</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EADFC9] border-l-4 border-l-[#C5A880] flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A38A67] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A38A67] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A38A67] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Scroll anchoring target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll down button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-8 p-2.5 rounded-full bg-black hover:bg-gray-900 text-white shadow-lg transition-all duration-300 hover:scale-105 z-10 focus:outline-none"
          title="Scroll to bottom"
          id="scroll-to-bottom-btn"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Form area */}
      <div className="p-6 border-t border-gray-100 bg-[#FFFFFF]" id="chat-input-panel">
        <div className="max-w-3xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="relative bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 pr-14 focus-within:ring-2 ring-black/5 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Message IGRIS...`}
              className="w-full bg-transparent border-none focus:ring-0 outline-none resize-none text-sm py-2 px-3 min-h-[44px] max-h-32 leading-relaxed text-[#111111]"
              rows={1}
              disabled={isGenerating}
            />

            <div className="absolute right-3 bottom-3">
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-transform active:scale-95 ${
                  input.trim() && !isGenerating
                    ? 'bg-black hover:bg-gray-900 text-white cursor-pointer hover:scale-105'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                id="send-message-btn"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Prompt Info footnotes */}
          <p className="text-center text-[10px] text-gray-400 mt-4 tracking-wide uppercase">
            Intelligence by IGRIS Collective &bull; Terms and Privacy apply
          </p>
        </div>
      </div>
    </div>
  );
}
