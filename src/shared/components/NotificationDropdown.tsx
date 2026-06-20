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
      description:
        'Your roof profile shows 18% higher solar efficiency than average. Check recommendations.',
      time: '2 hours ago',
      read: false,
      type: 'coach',
    },
    {
      id: '2',
      title: 'Badge Earned: Carbon Cutter',
      description:
        'Congratulations! You unlocked the Carbon Cutter badge for reducing emissions by 15%.',
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
        return <Sparkles className="h-4 w-4 text-emerald-400" />;
      case 'badge':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'metric':
        return <TrendingDown className="h-4 w-4 text-blue-400" />;
    }
  };

  const trigger = (
    <div className="relative rounded-lg border border-eco-500/20 bg-eco-500/10 p-2 text-eco-500 outline-none transition-all duration-200 hover:bg-eco-500/20 focus-visible:ring-2 focus-visible:ring-emerald-500">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 animate-bounce items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md">
          {unreadCount}
        </span>
      )}
      <span className="sr-only">Notifications</span>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} align="right">
      <div className="flex items-center justify-between border-b border-eco-500/10 px-4 py-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-semibold text-emerald-400 outline-none hover:text-emerald-300 focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <Check className="h-3 w-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="max-h-80 divide-y divide-eco-500/5 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-500">No notifications yet.</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 p-3 text-left transition-colors hover:bg-white/5 ${
                !item.read ? 'bg-emerald-500/5' : ''
              }`}
              role="menuitem"
              tabIndex={0}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-eco-500/10 bg-dark-900">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-xs font-semibold text-stone-200">{item.title}</p>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-stone-400">
                  {item.description}
                </p>
                <p className="text-[9px] text-stone-500">{item.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </DropdownMenu>
  );
}
