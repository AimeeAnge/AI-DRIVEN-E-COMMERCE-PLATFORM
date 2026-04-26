import React from "react";
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <section className="page-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="title-lg">{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </section>
  );
}
