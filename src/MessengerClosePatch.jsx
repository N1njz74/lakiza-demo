import { useEffect, useState } from 'react';

function findMessengerPanel() {
  const button = document.querySelector('button[aria-label="Сообщения"]');
  const panel = button?.nextElementSibling;
  return panel instanceof HTMLElement ? panel : null;
}

function closeMessenger() {
  const panel = findMessengerPanel();
  if (!panel) return;

  const buttons = [...panel.querySelectorAll('button')];
  const closeButton = buttons.find((button) => button.textContent?.trim() === '×');
  if (closeButton) closeButton.click();
}

export default function MessengerClosePatch() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(Boolean(findMessengerPanel()));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMessenger();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={closeMessenger}
      className="fixed right-5 top-28 z-[120] grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/75 text-xl font-black text-white shadow-2xl shadow-black/60 backdrop-blur-md transition active:scale-95 md:right-28 md:top-9"
      aria-label="Закрыть мессенджер"
      title="Закрыть мессенджер"
    >
      ×
    </button>
  );
}
