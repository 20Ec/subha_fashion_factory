"use client";

import { useRef } from "react";

/**
 * A GET form used for admin list filters. Selects apply immediately, while the
 * text input still submits on Enter or when the Apply button is clicked.
 */
export function AutoFilterForm({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      method="get"
      className={className}
      onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement) {
          formRef.current?.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}
