"use client";

interface ClearButtonProps {
  href: string;
  children: React.ReactNode;
}

export function ClearButton({ href, children }: ClearButtonProps) {
  const handleClick = () => {
    window.location.href = href;
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
