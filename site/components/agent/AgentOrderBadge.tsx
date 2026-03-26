export default function AgentOrderBadge() {
  return (
    <span
      role="status"
      aria-label="This order was placed by a Customer Service agent on your behalf"
      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
    >
      <svg
        aria-hidden="true"
        className="h-3 w-3 shrink-0"
        fill="none"
        viewBox="0 0 16 16"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 1a4 4 0 1 1 0 8A4 4 0 0 1 8 1zm0 10c-3.3 0-6 1.3-6 3v.5h12V14c0-1.7-2.7-3-6-3z"
        />
      </svg>
      CS Agent assisted
    </span>
  );
}
