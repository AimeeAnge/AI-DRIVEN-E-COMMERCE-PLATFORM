import React from "react";
export default function TextField({ label, id, as = "input", helper, ...props }) {
  const Component = as;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Component id={id} className={as === "textarea" ? "textarea" : "input"} {...props} />
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}
