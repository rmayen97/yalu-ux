
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Upload, 
  RefreshCcw, 
  X, 
  ChevronLeft, 
  Paperclip, 
  Smile, 
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  YumpiiBot, 
  YumpiiState, 
  Message, 
  Context 
} from './types';
import { 
  resolveVariables, 
  getTimestamp, 
  testRegex, 
  formatWhatsAppText 
} from './utils';
import { 
  ChatBubble, 
  ButtonGroup, 
  ListMessage 
} from './components/ChatElements';
import { 
  DebugPanel, 
  TypingIndicator 
} from './components/DebugPanel';

export default function App() {
  // State
  const [botData, setBotData] = useState<YumpiiBot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [interactivos, setInteractivos] = useState<any[]>([]);
  const [context, setContext] = useState<Context>({ 
    customer: { fullName: "Usuario de Prueba" },
    userFullName: "Usuario de Prueba"
  });
  const [history, setHistory] = useState<string[]>([]);
  const [currentStateKey, setCurrentStateKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeList, setActiveList] = useState<any | null>(null);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statesMapRef = useRef<Record<string, YumpiiState>>({});

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, interactivos]);

  // Auxiliares
  const addMessage = useCallback((type: 'bot' | 'user' | 'system', content: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      time: getTimestamp()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Motor de Estados
  const processState = useCallback((stateKey: string, currentContext: Context) => {
    const sMap = statesMapRef.current;
    const state = sMap[stateKey];

    if (!state) {
      addMessage('system', `⚠️ Estado no encontrado: "${stateKey}"`);
      return;
    }

    setCurrentStateKey(stateKey);
    setHistory(prev => [...prev, stateKey]);
    
    let nextInter: any[] = [];
    let hasContent = false;

    // Procesar contenido del estado
    (state.content || []).forEach(item => {
      const val = item.value;
      if (item.type === 'text') {
        const rawText = typeof val === 'string' ? val : (val && val.text) || '';
        const resolved = resolveVariables(rawText, currentContext);
        if (resolved.trim()) {
          addMessage('bot', resolved);
          hasContent = true;
        }
      } else if (item.type === 'button') {
        const btns = val?.buttons || [];
        const cap = resolveVariables(item.caption || '', currentContext);
        if (btns.length) {
          nextInter.push({ type: 'buttons', value: btns, caption: cap });
          hasContent = true;
        }
      } else if (item.type === 'list') {
        nextInter.push({ 
          type: 'list', 
          value: { 
            ...val, 
            bodyText: resolveVariables(val?.bodyText || '', currentContext), 
            footerText: resolveVariables(val?.footerText || '', currentContext) 
          } 
        });
        hasContent = true;
      } else if (item.type === 'location_request') {
        nextInter.push({ type: 'location_request' });
        hasContent = true;
      } else if (item.type === 'image') {
        addMessage('bot', '🖼️ [Imagen]');
        hasContent = true;
      }
    });

    setInteractivos(nextInter);

    // Lógica de transición automática y scripts
    const sorted = [...(state.transitions || [])].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

    // Si no hay contenido visible → auto-avance
    if (!hasContent) {
      const scriptT = sorted.find(t => t.type === 'script');
      if (scriptT) {
        const tmap = scriptT.params?.transitions || scriptT.params?.params?.body?.transitions || {};
        if (Object.keys(tmap).length) {
          addMessage('system', `⚙️ Script: ${scriptT.params?.script || 'script'} → Elige resultado:`);
          const sBtns = Object.entries(tmap).map(([k, tgt]) => ({ id: `__script__${tgt}`, title: `${k} → ${tgt}` }));
          setInteractivos([{ type: 'buttons', value: sBtns, caption: "" }]);
        }
        return;
      }
      const autoT = sorted.find(t => t.type === 'auto');
      if (autoT?.next) {
        let nc = { ...currentContext };
        if (autoT.variable_replace) {
          Object.entries(autoT.variable_replace).forEach(([k, v]) => {
            nc[k] = resolveVariables(typeof v === 'string' ? v : JSON.stringify(v), nc);
          });
        }
        setContext(nc);
        setTimeout(() => processState(autoT.next!, nc), 250);
        return;
      }
    }

    // Si hay contenido pero no hay interactivos ni transiciones de entrada → auto-avance
    if (hasContent && nextInter.length === 0) {
      const hasInputT = sorted.some(t => t.type === 'regex' || t.type === 'type');
      if (!hasInputT) {
        const scriptT = sorted.find(t => t.type === 'script');
        if (scriptT) {
          const tmap = scriptT.params?.transitions || scriptT.params?.params?.body?.transitions || {};
          const sBtns = Object.entries(tmap).map(([k, tgt]) => ({ id: `__script__${tgt}`, title: `${k} → ${tgt}` }));
          if (sBtns.length) {
            setInteractivos([{ type: 'buttons', value: sBtns, caption: "⚙️ Script fallback → Elige resultado:" }]);
          }
        } else {
          const autoT = sorted.find(t => t.type === 'auto');
          if (autoT?.next) {
            let nc = { ...currentContext };
            if (autoT.variable_replace) {
              Object.entries(autoT.variable_replace).forEach(([k, v]) => {
                nc[k] = resolveVariables(typeof v === 'string' ? v : JSON.stringify(v), nc);
              });
            }
            setContext(nc);
            setTimeout(() => processState(autoT.next!, nc), 800);
          }
        }
      }
    }
  }, [addMessage]);

  const handleUserInput = (displayText: string, rawValue?: string) => {
    if (!displayText.trim()) return;
    
    addMessage('user', displayText);
    setInteractivos([]);

    const sMap = statesMapRef.current;
    let ctx = { ...context };
    const curKey = currentStateKey;

    // Manejo de resultados de scripts
    if (typeof rawValue === 'string' && rawValue.startsWith('__script__')) {
      const target = rawValue.replace('__script__', '');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        processState(target, ctx);
      }, 600);
      return;
    }

    const state = sMap[curKey || ''];
    if (!state) {
      setIsTyping(false);
      return;
    }

    const candidates = [displayText, rawValue].filter(Boolean);
    const sorted = [...(state.transitions || [])].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    let matched = false;

    // Lógica de coincidencia por Regex
    for (const tr of sorted) {
      if (tr.type === 'regex' && tr.value) {
        if (testRegex(tr.value, candidates)) {
          matched = true;
          let nc = { ...ctx };
          if (tr.variable_replace) {
            Object.entries(tr.variable_replace).forEach(([k, v]) => {
              let r = typeof v === 'string' ? v : JSON.stringify(v);
              // Reemplazar placeholder especial de usuario
              r = r.replace(/\{\{context\.userMessage\.content\.text\}\}/g, displayText);
              r = resolveVariables(r, nc);
              nc[k] = r;
            });
          }
          setContext(nc);
          if (tr.next) {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              processState(tr.next!, nc);
            }, 700);
          }
          break;
        }
      }
    }

    if (!matched) {
      const scriptFb = sorted.find(t => t.type === 'script');
      const autoFb = sorted.find(t => t.type === 'auto');

      if (scriptFb) {
        const tmap = scriptFb.params?.transitions || scriptFb.params?.params?.body?.transitions || {};
        const errorTarget = tmap.error || tmap.Error;
        if (errorTarget) {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            processState(errorTarget, ctx);
          }, 700);
        } else {
          const sBtns = Object.entries(tmap).map(([k, tgt]) => ({ id: `__script__${tgt}`, title: `${k} → ${tgt}` }));
          if (sBtns.length) {
            addMessage('system', "⚙️ Script fallback → Selecciona:");
            setInteractivos([{ type: 'buttons', value: sBtns, caption: "" }]);
          }
        }
      } else if (autoFb) {
        let nc = { ...ctx };
        if (autoFb.variable_replace) {
          Object.entries(autoFb.variable_replace).forEach(([k, v]) => {
            let r = typeof v === 'string' ? v : JSON.stringify(v);
            r = r.replace(/\{\{context\.userMessage\.content\.text\}\}/g, displayText);
            nc[k] = r;
          });
        }
        setContext(nc);
        if (autoFb.next) {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            processState(autoFb.next!, nc);
          }, 700);
        }
      } else {
        setTimeout(() => {
          setIsTyping(false);
          const defaultText = botData?.structure?.default?.text || "No entiendo eso.";
          addMessage('bot', resolveVariables(defaultText, ctx));
        }, 800);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as YumpiiBot;
        if (!json.structure?.states || !json.structure?.entry) {
          throw new Error("El archivo no tiene el formato válido de Yumpii.");
        }
        
        const sMap: Record<string, YumpiiState> = {};
        json.structure.states.forEach(s => sMap[s.key] = s);
        statesMapRef.current = sMap;
        
        setBotData(json);
        setMessages([]);
        setHistory([]);
        setContext({ 
          customer: { fullName: "Usuario de Prueba" },
          userFullName: "Usuario de Prueba"
        });
        
        setTimeout(() => processState(json.structure.entry, { customer: { fullName: "Usuario de Prueba" }, userFullName: "Usuario de Prueba" }), 500);
      } catch (err: any) {
        setError(err.message || "Error al leer el archivo.");
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (!botData) return;
    setMessages([]);
    setHistory([]);
    setContext({ 
      customer: { fullName: "Usuario de Prueba" },
      userFullName: "Usuario de Prueba"
    });
    setInteractivos([]);
    processState(botData.structure.entry, { customer: { fullName: "Usuario de Prueba" }, userFullName: "Usuario de Prueba" });
  };

  // Render
  if (!botData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5] text-[#111b21] p-6 transition-colors">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white text-center"
        >
          <div className="w-24 h-24 bg-[#008069] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#008069]/20 transform rotate-[-10deg]">
            <Send className="text-white transform rotate-[-45deg] scale-150" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Bot Simulator</h1>
          <p className="text-[#667781] text-base mb-10 leading-relaxed font-medium">
            Sube tu configuración JSON para previsualizar y depurar flujos interactivos de Yumpii.
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#008069] hover:bg-[#00a884] text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-[#008069]/10 flex items-center justify-center gap-3 group active:scale-95"
          >
            <Upload size={20} className="group-hover:translate-y-[-2px] transition-transform" />
            Cargar Flujo JSON
          </button>
          
          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-500 text-xs font-mono font-bold uppercase tracking-wider">{error}</p>
            </div>
          )}
          
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#f8f9fa] rounded-2xl text-left border border-black/[0.03]">
              <div className="text-[11px] text-[#008069] font-black uppercase mb-1.5 tracking-tighter">QA Engine</div>
              <p className="text-[12px] text-[#667781] font-semibold leading-tight">Mapeo de Estados</p>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-2xl text-left border border-black/[0.03]">
              <div className="text-[11px] text-[#008069] font-black uppercase mb-1.5 tracking-tighter">Debug Console</div>
              <p className="text-[12px] text-[#667781] font-semibold leading-tight">Contexto en Vivo</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans transition-colors duration-300">
      {/* Main Container: Phone Centered */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative overflow-hidden bg-[#e3e5e8]">
        
        {/* IPHONE 15 PRO STYLE FRAME */}
        <div id="iphone-frame" className="relative w-full max-w-[400px] h-full max-h-[820px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.15)] rounded-[3.5rem] border-[12px] border-[#1a1a1a] flex flex-col overflow-hidden outline outline-[1px] outline-black/[0.1] active:shadow-2xl transition-all duration-500">
          
          {/* Dynamic Island / Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a1a] rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-500/10 rounded-full ml-10"></div>
          </div>

          {/* Physical Buttons Simulation */}
          <div className="absolute top-24 -left-[14px] w-[3px] h-8 bg-[#1a1a1a] rounded-l-md z-40"></div>
          <div className="absolute top-40 -left-[14px] w-[3px] h-14 bg-[#1a1a1a] rounded-l-md z-40"></div>
          <div className="absolute top-60 -left-[14px] w-[3px] h-14 bg-[#1a1a1a] rounded-l-md z-40"></div>
          <div className="absolute top-48 -right-[14px] w-[3px] h-16 bg-[#1a1a1a] rounded-r-md z-40"></div>

          {/* Header */}
          <div className="bg-[#008069] flex items-center pt-8 pb-3 h-[90px] px-5 gap-3 flex-shrink-0 z-20 shadow-sm transition-colors">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0 border border-white/10">
              🛒
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-[15px] truncate">{botData.name}</h2>
              <div className="flex items-center gap-1.5">
                <p className="text-white/80 text-[10px] truncate font-bold tracking-tight">EN LÍNEA · QA MODE</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <RefreshCcw size={17} className="hover:text-white cursor-pointer transition-colors" onClick={resetAll} />
              <X size={19} className="hover:text-red-300 cursor-pointer transition-colors" onClick={() => setBotData(null)} />
            </div>
          </div>

          {/* Chat Area with Light Pattern Background */}
          <div className="flex-1 relative overflow-hidden bg-[#efeae2]">
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 pointer-events-none bg-repeat opacity-[0.4] mix-blend-multiply z-0"
              style={{ 
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                backgroundSize: '400px',
              }}
            />
            
            {/* Scrollable Message Container */}
            <div 
              ref={scrollRef}
              className="absolute inset-0 overflow-y-auto px-1 pt-4 pb-4 space-y-1.5 z-10 scroll-smooth custom-scrollbar"
            >
              <div className="flex justify-center mb-5">
                <span className="bg-amber-100/80 text-amber-900/60 text-[9px] px-3 py-1 rounded-lg shadow-sm uppercase font-black tracking-[0.1em] border border-amber-200/50">
                  Secuencia de QA Asegurada
                </span>
              </div>

              {messages.map(msg => (
                msg.type === 'system' ? (
                  <div key={msg.id} className="flex justify-center my-3 px-6">
                    <span className="bg-white/90 backdrop-blur-sm text-[#008069] text-[9.5px] px-3 py-1 rounded-full border border-[#008069]/10 font-bold tracking-tight shadow-sm">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <ChatBubble key={msg.id} bot={msg.type === 'bot'} time={msg.time}>
                    {formatWhatsAppText(msg.content)}
                  </ChatBubble>
                )
              ))}

              {interactivos.map((item, idx) => (
                <div key={`int-${idx}`}>
                  {item.type === 'buttons' && (
                    <ButtonGroup 
                      buttons={item.value} 
                      caption={resolveVariables(item.caption || '', context)} 
                      onSelect={(t, id) => handleUserInput(t, id)} 
                    />
                  )}
                  {item.type === 'list' && (
                    <ListMessage 
                      data={{...item.value, bodyText: resolveVariables(item.value.bodyText, context)}} 
                      onSelect={(t, id) => handleUserInput(t, id)}
                      onOpen={() => setActiveList({...item.value, bodyText: resolveVariables(item.value.bodyText, context)})}
                    />
                  )}
                </div>
              ))}

              {isTyping && <TypingIndicator />}
            </div>
          </div>

          {/* List Menu Overlay (System Level) */}
          <AnimatePresence>
            {activeList && (
              <div 
                className="absolute inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" 
                onClick={() => setActiveList(null)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="w-full bg-white rounded-t-[2.5rem] max-h-[85%] overflow-hidden flex flex-col shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-6 border-b border-black/[0.03]">
                    <h3 className="text-[#111b21] font-extrabold text-lg">{activeList.buttonText || 'Opciones'}</h3>
                    <button onClick={() => setActiveList(null)} className="text-[#667781] p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-2 pt-2 pb-12 custom-scrollbar">
                    {(activeList.sections || []).flatMap((s: any) => s.rows || []).map((row: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => { 
                          handleUserInput(row.title, row.id); 
                          setActiveList(null); 
                        }}
                        className="w-full text-left px-5 py-4 hover:bg-[#f8f9fa] rounded-2xl transition-all border-b border-black/[0.01]"
                      >
                        <div className="text-[#111b21] text-[15px] font-bold">{row.title}</div>
                        {row.description && <div className="text-[#667781] text-[13px] mt-1 font-medium">{row.description}</div>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 flex-shrink-0 border-t border-[#000]/[0.03] z-20 pb-6 transition-colors">
            <div className="flex items-center gap-3 px-1 text-[#667781]">
              <Smile size={24} className="cursor-pointer hover:text-[#111b21] transition-colors" />
            </div>
            <div className="flex-1 bg-white rounded-2xl min-h-[42px] max-h-[120px] flex items-center px-4 shadow-sm border border-[#000]/[0.02]">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUserInput(inputValue);
                    setInputValue('');
                  }
                }}
                placeholder="Simular mensaje..." 
                className="w-full bg-transparent border-none text-[#111b21] text-[15px] outline-none py-2 font-medium"
              />
            </div>
            <div 
              className="w-[45px] h-[45px] bg-[#008069] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#00a884] active:scale-90 transition-all shadow-md shrink-0 focus:ring-2 focus:ring-[#008069]/20" 
              onClick={() => {
                if (inputValue.trim()) {
                  handleUserInput(inputValue);
                  setInputValue('');
                }
              }}
            >
              {inputValue.trim() ? <Send size={18} /> : <Mic size={22} />}
            </div>
          </div>
        </div>
      </div>

      {/* SIDE QA PANEL - PERSISTENT & CLEAN (Light) */}
      <div className="hidden xl:flex w-full max-w-[480px] border-l border-black/[0.05] bg-white shadow-2xl transition-all">
        <DebugPanel 
          currentState={currentStateKey} 
          history={history} 
          context={context} 
          isSidebar={true}
        />
      </div>
    </div>
  );
}
