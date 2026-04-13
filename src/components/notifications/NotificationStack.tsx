'use client';

import { AnimatePresence, motion } from 'framer-motion';

import Toast from '@/components/notifications/Toast';
import type { NotificationToastItem } from '@/lib/notifications/types';

interface NotificationStackProps {
  items: NotificationToastItem[];
  dismissNotification: (id: string) => void;
}

export default function NotificationStack({ items, dismissNotification }: NotificationStackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6.4rem)] z-[945] mx-auto flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div key={item.id} layout>
            <Toast item={item} onDismiss={dismissNotification} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
