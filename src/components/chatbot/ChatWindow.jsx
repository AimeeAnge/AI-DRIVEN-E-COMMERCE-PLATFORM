import React, { useState } from "react";
import { useChatbot } from "../../context/ChatbotContext";
import { chatbotService } from "../../services/chatbotService";
import { friendlyApiError } from "../../utils/apiErrors";
import Icon from "../common/Icon";
import MessageBubble from "./MessageBubble";

const starterPrompts = [
  "Can you help me find a product?",
  "What products do you recommend?",
  "How can I track my order?"
];

const technicalTerms = /\b(api|database|endpoint|metadata|rule_based|backend)\b/i;

function friendlyAssistantText(content, prompt) {
  const text = String(content || "").trim();
  if (!text) return "";
  if (!technicalTerms.test(text)) return text;
  if (/track|order/i.test(prompt)) {
    return "You can check your order status in your order history. I can also help you find the order page.";
  }
  if (/recommend|product|find/i.test(prompt)) {
    return "I can help you find products and suggest items that match what you are looking for.";
  }
  return "I can help you find products, explore recommendations, and understand your shopping options.";
}

export default function ChatWindow() {
  const { messages, setMessages, loading, setLoading, error, setError } = useChatbot();
  const [text, setText] = useState("");

  async function sendMessage(messageText) {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const userMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((current) => [...current, userMessage]);
    setText("");
    setLoading(true);
    setError(null);

    try {
      const response = await chatbotService.sendMessage({ message: trimmed });
      const assistantMessage = response?.data?.assistant_message || response?.assistant_message;
      const content = friendlyAssistantText(assistantMessage?.message_text || response?.message || response?.reply || response?.content, trimmed);
      if (content) {
        setMessages((current) => [
          ...current,
          {
            id: assistantMessage?.id || crypto.randomUUID(),
            role: "assistant",
            content
          }
        ]);
      }
    } catch (chatError) {
      console.log(chatError);
      setError(new Error(friendlyApiError(chatError, "I'm not connected right now. Please try again later.")));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(text);
  }

  return (
    <section className="chat-window" aria-label="AIDEP chatbot">
      <header>
        <div>
          <strong>AIDEP Assistant</strong>
          <span>Personal shopping help</span>
        </div>
        <Icon name="support_agent" />
      </header>
      <div className="chat-messages">
        {!messages.length ? (
          <div className="chat-empty">
            <Icon name="auto_awesome" size={32} />
            <p>I can help you find products, explore recommendations, and track your order.</p>
            <div className="starter-prompts">
              {starterPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        {loading ? <div className="typing-indicator">Assistant is finding a helpful answer...</div> : null}
        {error ? <p className="chat-error" role="alert">{error.message}</p> : null}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-message">Message</label>
        <input
          id="chat-message"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask about products, orders, or recommendations"
        />
        <button type="submit" aria-label="Send message">
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}
