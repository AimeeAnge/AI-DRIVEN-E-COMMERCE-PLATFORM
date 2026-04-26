import React, { createContext, useContext, useMemo, useState } from "react";

const ChatbotContext = createContext(null);

export function ChatbotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      messages,
      setMessages,
      error,
      setError,
      loading,
      setLoading
    }),
    [isOpen, messages, error, loading]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbot() {
  return useContext(ChatbotContext);
}
