
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, CheckCheck, Menu, ExternalLink, MapPin, X, ArrowRight } from 'lucide-react';
import { formatWhatsAppText } from '../utils';

interface BubbleProps {
  bot?: boolean;
  time: string;
  children: React.ReactNode;
}

export const ChatBubble: React.FC<BubbleProps> = ({ bot, time, children }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-1.5 px-3 ${bot ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`relative max-w-[85%] px-2.5 py-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.08)] ${
        bot 
          ? 'bg-white text-[#111b21] rounded-tr-xl rounded-br-xl rounded-bl-xl border border-black/5' 
          : 'bg-[#d9fdd3] text-[#111b21] rounded-tl-xl rounded-bl-xl rounded-br-xl border border-black/5'
      }`}>
        <div className="text-[14px] leading-[1.45] break-words whitespace-pre-wrap font-normal" dangerouslySetInnerHTML={{ __html: String(children) }} />
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-[#667781] font-medium">{time}</span>
          {!bot && <CheckCheck size={14} className="text-[#53bdeb]" />}
        </div>
        
        {/* Triangle pointer simulation if desired, or simplified rounded look */}
      </div>
    </motion.div>
  );
};

export const ButtonGroup: React.FC<{ 
  buttons: any[]; 
  caption?: string; 
  onSelect: (title: string, id: string) => void 
}> = ({ buttons, caption, onSelect }) => {
  return (
    <div className="flex flex-col w-full mb-3 px-3 items-start">
      {caption && (
        <div className="bg-white text-[#111b21] rounded-tr-xl rounded-br-xl rounded-bl-xl px-2.5 py-2 mb-1.5 max-w-[85%] shadow-[0_1px_1px_rgba(0,0,0,0.08)] border border-black/5">
          <div className="text-[14px] leading-[1.45]" dangerouslySetInnerHTML={{ __html: formatWhatsAppText(caption) }} />
        </div>
      )}
      <div className="flex flex-col gap-1 w-full max-w-[85%]">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(btn.title, btn.id)}
            className="w-full bg-white border border-black/[0.05] hover:bg-[#f8f9fa] text-[#008069] font-bold py-3 px-4 rounded-xl text-sm transition-all text-center shadow-sm active:scale-95"
          >
            {btn.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ListMessage: React.FC<{ 
  data: any; 
  onSelect: (title: string, id: string) => void;
  onOpen: () => void;
}> = ({ data, onOpen }) => {
  return (
    <div className="flex flex-col w-full mb-3 px-3 items-start">
      <div className="bg-white text-[#111b21] rounded-tr-xl rounded-br-xl rounded-bl-xl overflow-hidden max-w-[85%] w-full shadow-[0_1px_1px_rgba(0,0,0,0.08)] border border-black/5">
        {data.bodyText && (
          <div className="px-3 py-2.5 text-[14px] leading-[1.45]" dangerouslySetInnerHTML={{ __html: formatWhatsAppText(data.bodyText) }} />
        )}
        {data.footerText && (
          <div className="px-3 pb-2 text-[12px] text-[#667781] font-medium">{data.footerText}</div>
        )}
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-2 py-3 border-t border-black/[0.03] text-[#008069] font-bold text-sm hover:bg-[#f8f9fa] transition-colors"
        >
          <Menu size={16} />
          {data.buttonText || 'Ver opciones'}
        </button>
      </div>
    </div>
  );
};
