'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/toast-store';
import { submitContactMessage } from '@/lib/client-services';

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);

    try {
      await submitContactMessage({
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || '').trim().toLowerCase(),
        phone: String(formData.get('phone') || ''),
        subject: String(formData.get('subject') || ''),
        message: String(formData.get('message') || ''),
      });
      form.reset();
      addToast('Message sent successfully.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Message could not be sent.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="contact-name" className="text-[10px] font-black uppercase text-brand-dark-gray block">Your Name</label>
          <input id="contact-name" name="name" type="text" required minLength={2} maxLength={100} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
        </div>
        <div className="space-y-1">
          <label htmlFor="contact-email" className="text-[10px] font-black uppercase text-brand-dark-gray block">Email Address</label>
          <input id="contact-email" name="email" type="email" required maxLength={254} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-phone" className="text-[10px] font-black uppercase text-brand-dark-gray block">Phone (optional)</label>
        <input id="contact-phone" name="phone" type="tel" maxLength={30} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-subject" className="text-[10px] font-black uppercase text-brand-dark-gray block">Subject</label>
        <input id="contact-subject" name="subject" type="text" required minLength={2} maxLength={160} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-message" className="text-[10px] font-black uppercase text-brand-dark-gray block">Message</label>
        <textarea id="contact-message" name="message" rows={4} required minLength={10} maxLength={5000} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3 px-6 transition-colors clip-angled border border-brand-black disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Submit Message'}
      </button>
    </form>
  );
}
