import React, { createContext, useContext } from "react";

export const RouterContext = createContext({
  path: window.location.pathname,
  navigate: () => {}
});

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({ to, className, children, onClick, ...props }) {
  const { navigate } = useRouter();

  function handleClick(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export function matchRoute(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  return patternParts.reduce((params, part, index) => {
    if (params === null) return null;
    if (part.startsWith(":")) {
      return { ...params, [part.slice(1)]: decodeURIComponent(pathParts[index]) };
    }
    return part === pathParts[index] ? params : null;
  }, {});
}
