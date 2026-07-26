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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const clean = (node) => {
                  if (node.nodeType === 1) {
                    if (node.hasAttribute('bis_skin_checked')) {
                      node.removeAttribute('bis_skin_checked');
                    }
                    const children = node.getElementsByTagName('*');
                    for (let i = 0; i < children.length; i++) {
                      if (children[i].hasAttribute('bis_skin_checked')) {
                        children[i].removeAttribute('bis_skin_checked');
                      }
                    }
                  }
                };
                const observer = new MutationObserver((mutations) => {
                  for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                      if (mutation.target.hasAttribute('bis_skin_checked')) {
                        mutation.target.removeAttribute('bis_skin_checked');
                      }
                    }
                    for (const node of mutation.addedNodes) {
                      clean(node);
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['bis_skin_checked']
                });
              })();
            `
          }}
        />
      </head>
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
