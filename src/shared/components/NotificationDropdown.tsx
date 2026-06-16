'use client';

import { useState } from 'react';
import { Bell, Check, Sparkles, Award, TrendingDown } from 'lucide-react';
import DropdownMenu from './DropdownMenu';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'coach' | 'badge' | 'metric';
}

/**
 * NotificationDropdown renders the user notifications system.
 *
 * Implements:
 * 1. Accessible toggle with unread counter.
 * 2. Focus-navigable menu items.
 * 3. Categorized list items with rich icons.
 */
export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'AI Coach: Solar Opportunity',
      description: 'Your roof profile shows 18% higher solar efficiency than average. Check recommendations.',
      time: '2 hours ago',
      read: false,
      type: 'coach',
    },
    {
      id: '2',
      title: 'Badge Earned: Carbon Cutter',
      description: 'Congratulations! You unlocked the Carbon Cutter badge for reducing emissions by 15%.',
      time: '1 day ago',
      read: false,
      type: 'badge',
    },
    {
      id: '3',
      title: 'Monthly Savings Goal Met',
      description: 'Great job! Your transport carbon usage is down 20% compared to last month.',
      time: '3 days ago',
      read: true,
      type: 'metric',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'coach':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'badge':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'metric':
        return <TrendingDown className="w-4 h-4 text-blue-400" />;
    }
  };

  const trigger = (
    <div className="relative p-2 rounded-lg bg-eco-500/10 border border-eco-500/20 text-eco-500 hover:bg-eco-500/20 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md animate-bounce">
          {unreadCount}
        </span>
      )}
      <span className="sr-only">Notifications</span>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} align="right">
      <div className="px-4 py-2 border-b border-eco-500/10 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded px-1 py-0.5"
          >
            <Check className="w-3 h-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-eco-500/5">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 text-left transition-colors hover:bg-white/5 flex gap-3 ${
                !item.read ? 'bg-emerald-500/5' : ''
              }`}
              role="menuitem"
              tabIndex={0}
            >
              <div className="w-7 h-7 rounded-lg bg-dark-900 border border-eco-500/10 flex items-center justify-center shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-semibold text-stone-200 truncate">{item.title}</p>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">{item.description}</p>
                <p className="text-[9px] text-stone-500">{item.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </DropdownMenu>
  );
}
