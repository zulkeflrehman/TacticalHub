'use client';

import { useEffect, useRef, useState } from 'react';
import OrderManager from '@/components/admin/OrderManager';
import { listAllOrders, subscribeAllOrders } from '@/lib/client-services';
import type { OrderDto } from '@/lib/catalog-types';
import { useToastStore } from '@/lib/toast-store';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const notificationsRef = useRef(false);
  const soundRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    notificationsRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => () => {
    if (audioContextRef.current) void audioContextRef.current.close();
  }, []);

  useEffect(() => subscribeAllOrders((nextOrders, addedIds) => {
    setOrders(nextOrders);
    setLastUpdated(new Date());
    if (addedIds.length === 0) return;
    setNewOrderIds((current) => new Set([...current, ...addedIds]));
    const newest = nextOrders.find((order) => addedIds.includes(order.id));
    if (notificationsRef.current && 'Notification' in window && Notification.permission === 'granted' && newest) {
      new Notification(`New TecticalHub order ${newest.orderNumber}`, {
        body: `${newest.customerName} · Rs. ${newest.total.toLocaleString()}`,
      });
    }
    if (soundRef.current && audioContextRef.current) {
      const oscillator = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.06;
      oscillator.connect(gain);
      gain.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.18);
    }
  }, (error) => {
    addToast(error.message || 'The real-time order listener stopped.', 'error');
    setOrders((current) => current || []);
  }), [addToast]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setOrders(await listAllOrders());
      setLastUpdated(new Date());
      addToast('Orders refreshed from Firestore.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to refresh orders.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      addToast('This browser does not support dashboard notifications.', 'error');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);
      addToast(enabled
        ? 'Browser notifications enabled while this dashboard is open.'
        : 'Browser notification permission was not granted.', enabled ? 'success' : 'info');
    } catch {
      addToast('This browser could not enable dashboard notifications.', 'error');
    }
  };

  const toggleSound = async () => {
    const nextEnabled = !soundEnabled;
    try {
      if (nextEnabled) {
        audioContextRef.current ||= new AudioContext();
        await audioContextRef.current.resume();
      }
      setSoundEnabled(nextEnabled);
    } catch {
      addToast('This browser could not enable dashboard sound.', 'error');
    }
  };

  const markSeen = (id: string) => {
    setNewOrderIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Manage Orders</h1>
        <p className="text-xs text-brand-dark-gray font-semibold uppercase">Live COD orders, phone confirmation and fulfillment</p>
      </div>
      {orders ? (
        <OrderManager
          orders={orders}
          newOrderIds={newOrderIds}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          notificationsEnabled={notificationsEnabled}
          soundEnabled={soundEnabled}
          onRefresh={refresh}
          onEnableNotifications={enableNotifications}
          onToggleSound={toggleSound}
          onMarkSeen={markSeen}
        />
      ) : <p className="text-xs font-bold uppercase">Connecting to live orders...</p>}
    </div>
  );
}
