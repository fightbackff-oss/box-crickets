// Utility for common Tailwind class concatenation if needed
export function clean(...args: (string | undefined | false | null)[]) {
  return args.filter(Boolean).join(' ');
}
