import type { ReactNode } from "react";

export function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .site-footer {
            padding-bottom: calc(6.5rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
      <div className="mobile-action-bar fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-surface/88 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(23,57,87,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto max-w-md">{children}</div>
      </div>
    </>
  );
}
