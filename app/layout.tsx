import type { Metadata } from "next";
import "./globals.css";
import ToastContainer from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "TECTICALHUB | Premium Tactical Gear, Camping Tents & Self-Defense Accessories",
  description: "Pakistan's premium online store for military-grade equipment, camping tents, heavy-duty baton sticks, tasers, and travel accessories. Cash on Delivery across Pakistan.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "TECTICALHUB | Premium Tactical Gear, Camping Tents & Self-Defense",
    description: "Pakistan's premium online store for military-grade equipment, camping tents, heavy-duty baton sticks, tasers, and travel accessories. Cash on Delivery across Pakistan.",
    type: "website",
    locale: "en_US",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="font-sans h-full antialiased"
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-brand-light-gray text-brand-black"
        suppressHydrationWarning
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
