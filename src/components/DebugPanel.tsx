
import React, { useState } from 'react';
import { Terminal, Database, History, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface DebugPanelProps {
  currentState: string | null;
  history: string[];
  context: any;
}

export const DebugPanel: React.FC<DebugPanelProps & { isSidebar?: boolean }> = ({ currentState, history, context, isSidebar }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'flow' | 'context'>('flow');

  const content = (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex bg-[#f8f9fa] border-b border-black/[0.05]">
        <button 
          onClick={() => setActiveTab('flow')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black tracking-tighter transition-all ${
            activeTab === 'flow' ? 'text-[#008069] border-b-2 border-[#008069] bg-[#008069]/5' : 'text-[#667781]'
          }`}
        >
          <History size={13} />
          TRACE_LOG
        </button>
        <button 
          onClick={() => setActiveTab('context')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black tracking-tighter transition-all ${
            activeTab === 'context' ? 'text-[#008069] border-b-2 border-[#008069] bg-[#008069]/5' : 'text-[#667781]'
          }`}
        >
          <Database size={13} />
          DATA_STATE
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-6 font-mono text-[11px] bg-white">
        {activeTab === 'flow' ? (
          <div className="flex flex-col gap-3">
            {history.length > 0 ? (
              history.map((step, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <span className="text-[#667781]/30 w-6 shrink-0 text-right mt-1 font-bold italic">{i + 1}</span>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="bg-[#f8f9fa] border border-black/[0.03] p-3 rounded-2xl group-hover:border-[#008069]/30 transition-all shadow-sm">
                      <div className="text-[#111b21] font-bold break-all leading-tight">
                        {step}
                      </div>
                    </div>
                    {i < history.length - 1 && (
                      <div className="flex justify-center w-full">
                        <div className="w-px h-4 bg-gradient-to-b from-[#008069]/20 to-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#667781] opacity-20 py-20">
                <History size={48} strokeWidth={1} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Esperando ejecución...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full">
            <pre className="text-[#008069] whitespace-pre-wrap leading-relaxed font-semibold">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  if (isSidebar) {
    return (
      <div className="flex flex-col w-full h-full bg-white">
        <div className="flex items-center justify-between px-6 h-[90px] bg-white border-b border-black/[0.03] mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#008069]/10 rounded-xl">
              <Terminal size={18} className="text-[#008069]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-[#111b21]">Consola de QA</h3>
              <p className="text-[10px] text-[#667781] font-bold opacity-60">MONITOREO EN VIVO</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-[#008069] text-white rounded-lg text-[10px] font-black border border-[#008069]/20 shadow-lg shadow-[#008069]/20">
            STABLE
          </div>
        </div>
        
        {currentState && (
          <div className="p-6 bg-[#f8f9fa]/50 border-b border-black/[0.03]">
             <div className="text-[10px] text-[#667781] font-black uppercase mb-3 tracking-widest opacity-40">Nodo de Ejecución</div>
             <div className="px-4 py-3 bg-white text-[#008069] rounded-2xl border border-black/[0.03] text-[13px] font-mono font-bold break-all shadow-sm">
                {currentState}
             </div>
          </div>
        )}
        
        {content}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t border-black/[0.05] bg-white flex flex-col transition-all duration-300 z-50 ${isExpanded ? 'h-64' : 'h-12'}`}>
      <div 
        className="flex items-center justify-between px-6 h-12 cursor-pointer hover:bg-[#f8f9fa] border-b border-black/[0.01]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-[#008069]" />
          <span className="text-[11px] font-black uppercase tracking-widest text-[#111b21]">QA CONSOLE</span>
        </div>
        {isExpanded ? <ChevronDown size={18} className="text-[#667781]" /> : <ChevronUp size={18} className="text-[#667781]" />}
      </div>
      {isExpanded && content}
    </div>
  );
};

export const TypingIndicator: React.FC = () => (
  <div className="flex w-full mb-3 px-4 justify-start">
    <div className="bg-[#1d2a30] rounded-tr-lg rounded-br-lg rounded-bl-lg px-3 py-3 shadow-sm flex gap-1 items-center">
      <motion.div 
        animate={{ opacity: [0.3, 1, 0.3] }} 
        transition={{ duration: 1, repeat: Infinity, delay: 0 }} 
        className="w-1.5 h-1.5 bg-[#8696a0] rounded-full" 
      />
      <motion.div 
        animate={{ opacity: [0.3, 1, 0.3] }} 
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} 
        className="w-1.5 h-1.5 bg-[#8696a0] rounded-full" 
      />
      <motion.div 
        animate={{ opacity: [0.3, 1, 0.3] }} 
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} 
        className="w-1.5 h-1.5 bg-[#8696a0] rounded-full" 
      />
    </div>
  </div>
);
