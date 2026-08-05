'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import type { Contact } from './types';
import { getStatusDotColor } from './helpers';

interface ContactItemProps {
  contact: Contact;
  selected: boolean;
  onClick: () => void;
}

export function ContactItem({ contact, selected, onClick }: ContactItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
        selected ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        {contact.photo ? (
          <img
            src={contact.photo}
            alt={contact.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusDotColor(contact.status)}`}
        />
        {contact.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
            {contact.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">{contact.name}</h4>
          <span className="text-xs text-gray-500 flex-shrink-0">{contact.time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
          {contact.unreadCount > 0 && (
            <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              {contact.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
