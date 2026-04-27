import React from "react";
import { asArray } from "../../utils/formatters";
import StatusState from "../common/StatusState";

function cellValue(row, column) {
  if (column.render) return column.render(row);
  return row[column.key] ?? "";
}

export default function DataTable({ columns, data, loading, error, emptyMessage, onRetry }) {
  if (loading) return <StatusState type="loading" title="Loading records" message="We're getting everything ready." />;
  if (error) return <StatusState type="error" title="We couldn't load these records right now" message="Please try again later." actionLabel="Retry" onAction={onRetry} />;

  const rows = asArray(data);
  if (!rows.length) return <StatusState title="No records yet" message={emptyMessage || "New records will appear here when they're available."} />;

  return (
    <div className="table-wrap panel">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row._id || index}>
              {columns.map((column) => (
                <td key={column.key}>{cellValue(row, column)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
