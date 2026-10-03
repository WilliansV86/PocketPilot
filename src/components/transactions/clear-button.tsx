"use client";

interface ClearButtonProps {
  href: string;
  children: React.ReactNode;
}

export function ClearButton({ href, children }: ClearButtonProps) {
  const handleClick = () => {
    const destination = new URL(href, window.location.href);
    if (destination.pathname === window.location.pathname && destination.origin === window.location.origin) {
      window.history.pushState(null, "", destination.pathname + destination.search + destination.hash);
    } else {
      window.location.assign(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{ marginLeft: '10px', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
    >
      {children}
    </button>
  );
}
