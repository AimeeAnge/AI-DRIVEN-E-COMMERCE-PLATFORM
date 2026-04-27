import React from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ChatbotProvider } from "./context/ChatbotContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import ChatbotWidget from "./components/chatbot/ChatbotWidget.jsx";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <ChatbotProvider>
            <AppRoutes />
            <ChatbotWidget />
          </ChatbotProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
