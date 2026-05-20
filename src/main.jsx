import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import InteractiveApp from './InteractiveApp.jsx';
import './styles.css';

function RuntimePatch() {
  useEffect(() => {
    document.documentElement.dataset.build = 'runtime-patch-1759';
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          header > div > div:first-child > div:last-child > button:last-child {
            width: 2.5rem !important;
            height: 2.5rem !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            overflow: hidden !important;
            font-size: 0 !important;
            white-space: nowrap !important;
          }
          header > div > div:first-child > div:last-child > button:last-child::after {
            content: 'D';
            font-size: 0.875rem;
            line-height: 1;
          }
        }
      `}</style>
      <div className="fixed bottom-3 left-3 z-[9999] rounded-full bg-lime-300 px-3 py-1 text-[11px] font-black text-emerald-950 shadow-lg">
        build runtime-patch-1759
      </div>
      <InteractiveApp />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RuntimePatch />
  </React.StrictMode>
);
