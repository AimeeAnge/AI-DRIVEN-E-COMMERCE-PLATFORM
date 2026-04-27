import React from "react";
import Icon from "./Icon";

export default function MetricCard({ icon, label, value, detail }) {
  const displayValue = value === null || value === undefined || value === "" ? "0" : value;

  return (
    <article className="metric-card panel">
      <div className="metric-card__icon">
        <Icon name={icon} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{displayValue}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </article>
  );
}
