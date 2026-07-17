import React, { useState, useEffect } from 'react';
import { ChatThread, ChatMessage, AVAILABLE_MODELS, CustomPersona, BUILTIN_PERSONAS } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import GitHubPanel from './components/GitHubPanel';

const LOCAL_STORAGE_THREADS_KEY = 'igris_ai_threads';
const LOCAL_STORAGE_MODEL_KEY = 'igris_ai_selected_model';
const LOCAL_STORAGE_SEARCH_KEY = 'igris_ai_enable_search';

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.5-flash');
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);

  // Custom Personas state loaded from localStorage & BUILTIN_PERSONAS
  const [personas, setPersonas] = useState<CustomPersona[]>(() => {
    try {
      const savedCustom = localStorage.getItem('igris_ai_custom_personas');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        return [...BUILTIN_PERSONAS, ...parsed];
      }
    } catch (e) {
      console.error('Failed to parse offline custom intelligence matrices:', e);
    }
    return BUILTIN_PERSONAS;
  });

  const [activePersonaId, setActivePersonaId] = useState<string>('igris-intellect');

  // Initialize state from local storage on mount
  useEffect(() => {
    try {
      const savedThreads = localStorage.getItem(LOCAL_STORAGE_THREADS_KEY);
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      }

      const savedModel = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
      if (savedModel && AVAILABLE_MODELS.some((m) => m.id === savedModel)) {
        setSelectedModelId(savedModel);
      } else {
        setSelectedModelId('gemini-3.5-flash');
        localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, 'gemini-3.5-flash');
      }

      const savedSearch = localStorage.getItem(LOCAL_STORAGE_SEARCH_KEY);
      if (savedSearch) {
        setEnableSearch(savedSearch === 'true');
      }
    } catch (e) {
      console.error('Failed to restore offline consulting chronicles:', e);
    }
  }, []);

  // Save to local storage when state change
  const saveThreadsToLocalStorage = (updatedThreads: ChatThread[]) => {
    localStorage.setItem(LOCAL_STORAGE_THREADS_KEY, JSON.stringify(updatedThreads));
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
  };

  const handleNewThread = () => {
    setActiveThreadId(null);
  };

  const handleDeleteThread = (id: string) => {
    const updated = threads.filter((t) => t.id !== id);
    setThreads(updated);
    saveThreadsToLocalStorage(updated);

    if (activeThreadId === id) {
      setActiveThreadId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    const updated = threads.map((t) => {
      if (t.id === id) {
        return { ...t, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    setThreads(updated);
    saveThreadsToLocalStorage(updated);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, modelId);
  };

  const handleToggleSearch = (enabled: boolean) => {
    setEnableSearch(enabled);
    localStorage.setItem(LOCAL_STORAGE_SEARCH_KEY, String(enabled));
  };

  const handleSelectPersona = (personaId: string) => {
    setActivePersonaId(personaId);

    // Automatically set the engine model recommended by this persona
    const foundPersona = personas.find((p) => p.id === personaId);
    if (foundPersona && foundPersona.model) {
      setSelectedModelId(foundPersona.model);
      localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, foundPersona.model);
    }

    // Force context restart by opening a new chat window
    setActiveThreadId(null);
  };

  const handleCreatePersona = (newPersonaData: Omit<CustomPersona, 'id'>) => {
    const newId = `custom-persona-${Date.now()}`;
    const newPersona: CustomPersona = {
      ...newPersonaData,
      id: newId,
    };

    const currentCustom = personas.filter((p) => p.isCustom);
    const updatedCustom = [...currentCustom, newPersona];

    localStorage.setItem('igris_ai_custom_personas', JSON.stringify(updatedCustom));
    setPersonas([...BUILTIN_PERSONAS, ...updatedCustom]);

    // Select the freshly minted AI Persona automatically
    handleSelectPersona(newId);
  };

  const handleDeletePersona = (id: string) => {
    const updatedCustom = personas.filter((p) => p.isCustom && p.id !== id);
    localStorage.setItem('igris_ai_custom_personas', JSON.stringify(updatedCustom));
    setPersonas([...BUILTIN_PERSONAS, ...updatedCustom]);

    if (activePersonaId === id || (activeThread?.personaId === id)) {
      handleSelectPersona('igris-intellect');
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // Compute active persona dynamically based on whether activeThread contains a bound personaId
  const currentPersonaId = activeThread?.personaId || activePersonaId;
  const activePersona = personas.find((p) => p.id === currentPersonaId) || personas[0] || BUILTIN_PERSONAS[0];

  const handleSendMessage = async (content: string) => {
    if (isGenerating) return;

    let currentThreadId = activeThreadId;
    let currentThreads = [...threads];
    let activeThreadObj = currentThreads.find((t) => t.id === currentThreadId);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // 1. Setup Active Thread (Create if none exists)
    if (!activeThreadObj) {
      const shortTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: shortTitle,
        messages: [userMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: selectedModelId,
        personaId: activePersonaId, // Bind active persona to thread lifecycle
      };

      currentThreads = [newThread, ...currentThreads];
      setThreads(currentThreads);
      saveThreadsToLocalStorage(currentThreads);
      setActiveThreadId(newThread.id);
      currentThreadId = newThread.id;
      activeThreadObj = newThread;
    } else {
      // Append user message to active thread
      activeThreadObj.messages = [...activeThreadObj.messages, userMessage];
      activeThreadObj.updatedAt = new Date().toISOString();
      setThreads(currentThreads);
      saveThreadsToLocalStorage(currentThreads);
    }

    // 2. Setup Assistant Stream Placeholder
    const assistantMessageId = `assist-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      modelUsed: AVAILABLE_MODELS.find((m) => m.id === selectedModelId)?.name || activePersona.name,
    };

    activeThreadObj.messages = [...activeThreadObj.messages, assistantPlaceholder];
    setThreads([...currentThreads]);
    setIsGenerating(true);

    // 3. Query SSE Stream from full-stack endpoint
    try {
      // Gather relevant history. Only pass user and assistant roles (filter out system)
      const chatHistory = activeThreadObj.messages
        .filter((msg) => msg.id !== assistantMessageId)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          model: selectedModelId,
          enableSearch,
          systemInstruction: activePersona.systemInstruction,
          temperature: activePersona.temperature,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Command center responded with error status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to initialize response stream reader.');
      }

      const decoder = new TextDecoder();
      let partialLine = '';
      let accumulatedText = '';
      let detectedGrounding: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunkStr).split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || !cleanLine.startsWith('data: ')) continue;

          const dataStr = cleanLine.substring(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) {
              throw new Error(payload.error);
            }

            if (payload.text) {
              accumulatedText += payload.text;
            }
            if (payload.grounding) {
              detectedGrounding = payload.grounding;
            }

            // Real-time incremental state update
            setThreads((prevThreads) => {
              return prevThreads.map((t) => {
                if (t.id === currentThreadId) {
                  return {
                    ...t,
                    messages: t.messages.map((m) => {
                      if (m.id === assistantMessageId) {
                        return {
                          ...m,
                          content: accumulatedText,
                          grounding: detectedGrounding || m.grounding,
                        };
                      }
                      return m;
                    }),
                  };
                }
                return t;
              });
            });
          } catch (e) {
            console.error('Failed to parse SSE payload line:', e);
          }
        }
      }

      // Final persistence
      setThreads((prevThreads) => {
        saveThreadsToLocalStorage(prevThreads);
        return prevThreads;
      });
    } catch (error: any) {
      console.error('Sovereign communication failed:', error);
      
      const elegantErrorMessage = `An elegant system error has occurred during communication with the Imperial command matrix.\n\n**Reason:** ${error.message || 'The backend is currently preparing settings or experiencing transient latency.'}\n\n*Please verify that your GEMINI_API_KEY is configured in **Settings > Secrets** or try again shortly.*`;

      setThreads((prevThreads) => {
        const updated = prevThreads.map((t) => {
          if (t.id === currentThreadId) {
            return {
              ...t,
              messages: t.messages.map((m) => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    content: elegantErrorMessage,
                  };
                }
                return m;
              }),
            };
          }
          return t;
        });
        saveThreadsToLocalStorage(updated);
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans" id="igris-app-root">
      {/* Dynamic sidebar */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        selectedModelId={selectedModelId}
        enableSearch={enableSearch}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
        onSelectModel={handleSelectModel}
        onToggleSearch={handleToggleSearch}

        personas={personas}
        activePersonaId={currentPersonaId}
        onSelectPersona={handleSelectPersona}
        onCreatePersona={handleCreatePersona}
        onDeletePersona={handleDeletePersona}
      />

      {/* Primary chat workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        <ChatWindow
          messages={activeThread ? activeThread.messages : []}
          isGenerating={isGenerating}
          activeModelId={selectedModelId}
          onSendMessage={handleSendMessage}
          activePersona={activePersona}
          isGitHubOpen={isGitHubOpen}
          onToggleGitHub={() => setIsGitHubOpen(!isGitHubOpen)}
        />
        {isGitHubOpen && (
          <GitHubPanel
            onClose={() => setIsGitHubOpen(false)}
            onInjectPrompt={(promptText) => {
              // Automatically elevate the intelligence matrix to Git Archivist for GitHub tasks!
              if (personas.some(p => p.id === 'git-archivist')) {
                handleSelectPersona('git-archivist');
              }
              handleSendMessage(promptText);
            }}
          />
        )}
      </div>
    </div>
  );
}
