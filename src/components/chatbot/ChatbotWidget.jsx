import React from "react";
import { useChatbot } from "../../context/ChatbotContext";
import Icon from "../common/Icon";
import ChatWindow from "./ChatWindow";

export default function ChatbotWidget() {
  const { isOpen, setIsOpen } = useChatbot();

  return (
    <div className="chatbot-widget">
      {isOpen ? <ChatWindow /> : null}
      <button
        className="chatbot-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon name={isOpen ? "close" : "smart_toy"} />
        <span>{isOpen ? "Close" : "Get Help"}</span>
      </button>
    </div>
  );
}
