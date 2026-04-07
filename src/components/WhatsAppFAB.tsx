import { MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";

const WHATSAPP_NUMBER = "5535997570009";

const WhatsAppFAB = () => {
  const handleClick = () => {
    openWhatsApp(WHATSAPP_NUMBER, "Olá! Gostaria de fazer um pedido. Podem me ajudar?");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--whatsapp))] text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
      aria-label="Chamar pelo WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
};

export default WhatsAppFAB;
