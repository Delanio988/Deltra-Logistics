"use client";

import { useState } from "react";
import { formatPhoneDisplay, telHref, whatsAppHref } from "@/lib/phone";
import { cn } from "@/lib/utils";

type ContactLinksProps = {
  email: string;
  phone: string | null;
  /** "compact": icon-only buttons for table rows / list cards, no room for
   *  the raw values. "full": shows the actual email/phone text next to
   *  each action, for a customer-detail context panel. */
  variant?: "compact" | "full";
  className?: string;
};

const MailIcon = (
  <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhoneIcon = (
  <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path
      d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1L6.6 10.8z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path
      d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 8.8c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .5.4.2.5.6 1.6.7 1.7.1.1.1.3 0 .4-.1.2-.2.3-.3.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.2.1.4.1.5-.1.2-.2.6-.7.8-.9.2-.2.3-.2.5-.1.2.1 1.4.7 1.6.8.2.1.3.1.4.3.1.2.1.9-.2 1.4-.3.6-1.6 1.2-2.2 1.2-.6 0-1.1.1-3.6-1-2.9-1.2-4.7-4.2-4.9-4.4-.1-.2-1.2-1.5-1.2-2.9 0-1.4.7-2 1-2.3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = (
  <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = (
  <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const iconButtonClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full p-1.5 text-fg/40 transition-colors hover:bg-fg/5 hover:text-accent";

/** Email/phone contact actions for an admin looking at a customer — reused
 *  everywhere a customer's contact info needs to be reachable without
 *  leaving the page: mailto:, tel:, a WhatsApp deep link, and copy buttons. */
export default function ContactLinks({ email, phone, variant = "full", className }: ContactLinksProps) {
  const [copiedField, setCopiedField] = useState<"email" | "phone" | null>(null);

  const copy = async (field: "email" | "phone", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 2000);
    } catch {
      // Clipboard access denied — the link/text is still usable manually.
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        <a href={`mailto:${email}`} data-cursor-hover="Email" aria-label={`Email ${email}`} className={iconButtonClass}>
          {MailIcon}
        </a>
        {phone && (
          <>
            <a
              href={telHref(phone)}
              data-cursor-hover="Call"
              aria-label={`Call ${formatPhoneDisplay(phone)}`}
              className={iconButtonClass}
            >
              {PhoneIcon}
            </a>
            <a
              href={whatsAppHref(phone)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover="WhatsApp"
              aria-label={`WhatsApp ${formatPhoneDisplay(phone)}`}
              className={cn(iconButtonClass, "hover:text-green-600 dark:hover:text-green-400")}
            >
              {WhatsAppIcon}
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <a
          href={`mailto:${email}`}
          data-cursor-hover="Email"
          className="flex min-w-0 items-center gap-1.5 text-sm text-fg/70 transition-colors hover:text-accent"
        >
          <span className="h-3.5 w-3.5 shrink-0" aria-hidden>
            {MailIcon}
          </span>
          <span className="truncate">{email}</span>
        </a>
        <button
          type="button"
          onClick={() => copy("email", email)}
          data-cursor-hover="Copy"
          aria-label="Copy email"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-1 text-fg/30 transition-colors hover:bg-fg/5 hover:text-accent"
        >
          {copiedField === "email" ? CheckIcon : CopyIcon}
        </button>
      </div>
      {phone && (
        <div className="flex items-center gap-1.5">
          <a
            href={telHref(phone)}
            data-cursor-hover="Call"
            className="flex items-center gap-1.5 text-sm text-fg/70 transition-colors hover:text-accent"
          >
            <span className="h-3.5 w-3.5 shrink-0" aria-hidden>
              {PhoneIcon}
            </span>
            {formatPhoneDisplay(phone)}
          </a>
          <a
            href={whatsAppHref(phone)}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-hover="WhatsApp"
            aria-label="WhatsApp"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-1 text-green-600 transition-colors hover:bg-fg/5 dark:text-green-400"
          >
            {WhatsAppIcon}
          </a>
          <button
            type="button"
            onClick={() => copy("phone", phone)}
            data-cursor-hover="Copy"
            aria-label="Copy phone number"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-1 text-fg/30 transition-colors hover:bg-fg/5 hover:text-accent"
          >
            {copiedField === "phone" ? CheckIcon : CopyIcon}
          </button>
        </div>
      )}
    </div>
  );
}
