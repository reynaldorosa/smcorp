'use client';

import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from './types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[65%] rounded-lg px-3 py-2 ${
          message.sent
            ? 'bg-[#d9fdd3] text-gray-900'
            : 'bg-white text-gray-900'
        } shadow-sm`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-gray-500">{message.time}</span>
          {message.sent && (
            <span className="text-gray-500">
              {message.read ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
