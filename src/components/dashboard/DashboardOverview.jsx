import React from "react";
import MetricCard from "../common/MetricCard";

export default function DashboardOverview({ metrics = [] }) {
  return (
    <div className="metrics-grid">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
