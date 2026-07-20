'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, Users } from 'lucide-react';
import {
  listContactMessages,
  listNewsletterSubscribers,
  resolveContactMessage,
} from '@/lib/client-services';
import type { ContactMessageDto, NewsletterSubscriberDto } from '@/lib/catalog-types';
import { useToastStore } from '@/lib/toast-store';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessageDto[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    Promise.all([listContactMessages(), listNewsletterSubscribers()])
      .then(([contactMessages, newsletterSubscribers]) => {
        setMessages(contactMessages);
        setSubscribers(newsletterSubscribers);
      })
      .catch((error) => addToast(error instanceof Error ? error.message : 'Unable to load messages.', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const activeSubscribers = useMemo(
    () => subscribers.filter((subscriber) => subscriber.status === 'ACTIVE'),
    [subscribers],
  );

  const markResolved = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveContactMessage(id);
      setMessages((current) => current.map((message) => message.id === id
        ? { ...message, status: 'RESOLVED' }
        : message));
      addToast('Contact message marked as resolved.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update the message.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase">Messages</h1>
        <p className="text-xs text-brand-dark-gray font-semibold uppercase">Contact requests and newsletter subscribers</p>
      </div>

      {loading ? <p className="text-xs font-bold uppercase">Loading messages...</p> : (
        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase">
                <Mail className="h-4 w-4 text-brand-accent" /> Contact inbox
              </h2>
              <span className="text-[10px] font-bold uppercase text-brand-dark-gray">
                {messages.filter((message) => message.status === 'NEW').length} new
              </span>
            </div>
            {messages.map((message) => (
              <article key={message.id} className="space-y-3 border border-brand-black/5 bg-brand-white p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <h3 className="text-sm font-black">{message.subject}</h3>
                    <p className="text-xs font-semibold text-brand-dark-gray">
                      {message.name} · <a className="underline" href={`mailto:${message.email}`}>{message.email}</a>
                      {message.phone ? ` · ${message.phone}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-brand-dark-gray">
                    {message.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-brand-dark-gray">{message.message}</p>
                {message.status === 'NEW' ? (
                  <button
                    type="button"
                    disabled={resolvingId === message.id}
                    onClick={() => markResolved(message.id)}
                    className="flex items-center gap-2 bg-brand-black px-3 py-2 text-[10px] font-black uppercase text-brand-white disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-accent" /> Mark resolved
                  </button>
                ) : <span className="text-[10px] font-black uppercase text-green-700">Resolved</span>}
              </article>
            ))}
            {messages.length === 0 && <p className="border border-brand-black/5 bg-brand-white p-5 text-xs text-brand-dark-gray">No contact requests yet.</p>}
          </section>

          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase">
              <Users className="h-4 w-4 text-brand-accent" /> Newsletter ({activeSubscribers.length})
            </h2>
            <div className="divide-y divide-brand-black/5 border border-brand-black/5 bg-brand-white">
              {activeSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="p-4">
                  <a className="break-all text-xs font-bold underline" href={`mailto:${subscriber.email}`}>{subscriber.email}</a>
                  <p className="mt-1 text-[10px] font-semibold uppercase text-brand-dark-gray">
                    Joined {subscriber.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
              {activeSubscribers.length === 0 && <p className="p-4 text-xs text-brand-dark-gray">No subscribers yet.</p>}
            </div>
            <p className="text-[10px] leading-relaxed text-brand-dark-gray">
              Spark hosting does not send bulk email. Export or contact subscribers only through a consent-compliant email provider.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
