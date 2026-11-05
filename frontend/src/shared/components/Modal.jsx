import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Overlay({ children, close, className = '' }) {
  const ref = useRef();
  useEffect(() => {
    const old = document.activeElement;
    ref.current?.focus();
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const list = ref.current.querySelectorAll(
        'button,input,select,textarea,video,[tabindex="0"]',
      );
      const available = [...list].filter((el) => !el.disabled && el.getClientRects().length);
      const first = available[0],
        last = available.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const el = ref.current;
    el.addEventListener('keydown', trap);
    return () => {
      el.removeEventListener('keydown', trap);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Thông tin VuiPhim"
        className={'modal ' + className}
      >
        <button className="close-modal" aria-label="Đóng" onClick={close}>
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
