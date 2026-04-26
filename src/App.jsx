import React from "react";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ChatbotProvider } from "./context/ChatbotContext.jsx";
import ChatbotWidget from "./components/chatbot/ChatbotWidget.jsx";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ChatbotProvider>
          <AppRoutes />
          <ChatbotWidget />
        </ChatbotProvider>
      </CartProvider>
    </AuthProvider>
  );
}
