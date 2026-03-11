import { hashColor } from "@/lib/utils";

interface MemberAvatarProps {
  name: string;
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function MemberAvatar({ name, initials, size = "md" }: MemberAvatarProps) {
  const color = hashColor(name);
  return (
    <span
      className={`${sizes[size]} inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
