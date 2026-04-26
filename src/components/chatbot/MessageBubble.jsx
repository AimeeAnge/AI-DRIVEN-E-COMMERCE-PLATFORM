import React from "react";
import Icon from "../common/Icon";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "is-user" : ""}`}>
      <div className="message-avatar">
        <Icon name={isUser ? "person" : "smart_toy"} size={20} />
      </div>
      <div className="message-content">
        <div className="message-bubble">{message.content}</div>
        <span>{isUser ? "You" : "AIDEP Assistant"}</span>
      </div>
    </div>
  );
}
