import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { DriverContact, ChatMessageItem } from '../model/lifecycleTypes';

interface TripChatViewProps {
  driver: DriverContact;
  initialMessages?: ChatMessageItem[];
  onBack: () => void;
  onCallDriver: () => void;
  onSendMessage?: (text: string) => void;
}

const DEFAULT_MESSAGES: ChatMessageItem[] = [
  {
    id: 'msg-sys-1',
    sender: 'system',
    text: 'Бронювання підтверджено. Водій прийняв вашу заявку на поїздку Львів → Київ.',
    time: '18:10',
  },
  {
    id: 'msg-driver-1',
    sender: 'driver',
    text: 'Доброго дня! Я вже вирушаю з гаража на Стрийську 45. Буду о 18:25 біля АЗС WOG.',
    time: '18:12',
    status: 'read',
  },
  {
    id: 'msg-me-1',
    sender: 'me',
    text: 'Чудово! Я вже підходжу з рюкзаком.',
    time: '18:14',
    status: 'read',
  },
];

const QUICK_CHIPS = [
  'Я на місці 📍',
  'Запізнююсь на 5 хв ⏱️',
  'Де ви стоїте? 🚗',
  'Вже підходжу 🚶',
];

export const TripChatView: React.FC<TripChatViewProps> = ({
  driver,
  initialMessages = DEFAULT_MESSAGES,
  onBack,
  onCallDriver,
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text,
      time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    onSendMessage?.(text);

    // Simulated driver friendly auto-reply after 1.5s
    if (text.includes('на місці') || text.includes('підходжу')) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-reply-${Date.now()}`,
            sender: 'driver',
            text: 'Добре, бачу вас! Вмикаю аварійку на чорній Toyota Camry.',
            time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
            status: 'read',
          },
        ]);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-40 mx-auto flex flex-col w-full max-w-md overflow-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white">
      {/* Chat Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
            aria-label="Назад"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-100">
                <img
                  src={driver.avatar}
                  alt={driver.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-black text-[#081B35] dark:text-white">
                  {driver.name}
                </h1>
                {driver.verified && (
                  <ShieldCheck size={13} className="text-[#0866F5]" fill="currentColor" />
                )}
              </div>
              <p className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
                {driver.vehicleModel} · Онлайн
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCallDriver}
          className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16B87A] transition active:scale-95"
          aria-label="Зателефонувати"
          title="Зателефонувати водієві"
        >
          <Phone size={18} />
        </button>
      </header>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="max-w-[85%] rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 px-3.5 py-2 text-center text-[11px] font-semibold text-[#0755CA] dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/40">
                  {msg.text}
                </div>
              </div>
            );
          }

          const isMe = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-[20px] px-4 py-2.5 shadow-xs ${
                  isMe
                    ? 'bg-[#0866F5] text-white rounded-br-xs'
                    : 'bg-white dark:bg-[#111e36] text-[#081B35] dark:text-white rounded-bl-xs border border-slate-100 dark:border-slate-800'
                }`}
              >
                <p className="text-[13.5px] leading-relaxed break-words">{msg.text}</p>
                <div
                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                    isMe ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.time}</span>
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck size={12} className="text-white" />
                      ) : (
                        <Check size={12} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reply Chips */}
      <div className="shrink-0 overflow-x-auto px-3 py-2 bg-white/70 dark:bg-[#0B1730]/70 backdrop-blur-sm border-t border-slate-100/60 dark:border-slate-800/60 flex items-center gap-1.5 scrollbar-none">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleSend(chip)}
            className="shrink-0 rounded-full bg-[#EAF3FF] dark:bg-blue-950/70 px-3 py-1 text-[11px] font-bold text-[#0866F5] dark:text-blue-300 border border-[#D3E5FD] dark:border-blue-900/40 hover:bg-blue-100 transition active:scale-95"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 p-3 bg-white dark:bg-[#0B1730] border-t border-slate-100 dark:border-slate-800 pb-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300"
            aria-label="Додати файл"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Напишіть повідомлення водієві…"
            className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-[#081B35] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0866F5]/40"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#0866F5] text-white disabled:opacity-40 transition active:scale-95 shadow-md shadow-blue-500/25"
            aria-label="Надіслати"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
