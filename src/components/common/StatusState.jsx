import React from "react";
import Icon from "./Icon";

const friendlyFallbacks = {
  error: "Something went wrong. Please try again later.",
  loading: "This should only take a moment.",
  empty: "There's nothing to show yet."
};

export default function StatusState({ type = "empty", title, message, actionLabel, onAction }) {
  const icon = type === "error" ? "error" : type === "loading" ? "progress_activity" : "inventory_2";
  const visibleMessage = message || friendlyFallbacks[type] || friendlyFallbacks.empty;

  return (
    <div className={`state-box panel ${type === "error" ? "danger" : ""}`} role={type === "error" ? "alert" : "status"}>
      <Icon name={icon} size={34} />
      <strong>{title}</strong>
      {visibleMessage ? <span className="muted">{visibleMessage}</span> : null}
      {actionLabel && onAction ? (
        <button className="secondary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
