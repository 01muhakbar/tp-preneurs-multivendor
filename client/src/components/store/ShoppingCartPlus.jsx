export default function ShoppingCartPlus({ size = 16, className = "w-4 h-4", ...props }) {
  const sizeProps = size ? { width: size, height: size } : {};
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...sizeProps}
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      <line x1="13.5" y1="8.5" x2="13.5" y2="14.5" />
      <line x1="10.5" y1="11.5" x2="16.5" y2="11.5" />
    </svg>
  );
}

export { ShoppingCartPlus };
