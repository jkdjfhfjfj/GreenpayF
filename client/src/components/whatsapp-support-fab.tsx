import { MessageCircle } from "lucide-react";

export function WhatsAppSupportFAB() {
  const phoneNumber = "+14704657028";
  const whatsappLink = `https://wa.me/14704657028?text=${encodeURIComponent("Hi, I need support with GreenPay")}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
