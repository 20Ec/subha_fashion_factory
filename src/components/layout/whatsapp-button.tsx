import { SITE } from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

/**
 * Site-wide WhatsApp chat shortcut. Sits above the mobile sticky purchase bar
 * and expands into a labelled button on larger screens.
 */
export function WhatsAppButton() {
  return (
    <a
      href={SITE.whatsapp.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${SITE.name} on WhatsApp at ${SITE.whatsapp.display}`}
      className="group fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center gap-2.5 rounded-full bg-[#25D366] text-white shadow-[0_16px_36px_-12px_rgba(37,211,102,0.8)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1fbe5a] hover:shadow-[0_20px_44px_-12px_rgba(37,211,102,0.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/35 sm:right-6 lg:bottom-6 lg:w-auto lg:px-5"
    >
      <WhatsAppIcon className="h-7 w-7 shrink-0 lg:h-6 lg:w-6" />
      <span className="hidden whitespace-nowrap text-sm font-semibold lg:inline">
        Chat on WhatsApp
      </span>
    </a>
  );
}
