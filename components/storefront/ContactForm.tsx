'use client';

export default function ContactForm() {
  return (
    <form className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Your Name</label>
          <input type="text" required className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Email Address</label>
          <input type="email" required className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Subject</label>
        <input type="text" required className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Message</label>
        <textarea rows={4} required className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
      </div>
      <button
        type="button"
        onClick={() => alert('Message received! We will get back to you shortly.')}
        className="bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3 px-6 transition-colors clip-angled border border-brand-black"
      >
        Submit Message
      </button>
    </form>
  );
}
