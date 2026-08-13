"use client";

import { useState } from "react";

type PasswordInputProps = {
  name?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
};

export function PasswordInput({
  name = "password",
  placeholder = "Password",
  required = true,
  minLength = 8,
  autoComplete = "current-password",
  className = "input",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={`${className} pr-11`}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.8 11.8 0 01-2.16 3.19M6.11 6.11A11.75 11.75 0 001 12c1.73 3.89 6 7 11 7 1.28 0 2.49-.22 3.6-.6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        )}
      </button>
    </div>
  );
}
