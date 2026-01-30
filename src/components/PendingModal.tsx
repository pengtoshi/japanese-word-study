"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";

function CuteLoadingSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 140"
      className={className}
      role="img"
      aria-label="로딩 애니메이션"
    >
      <path
        d="M50,120 C20,95 18,60 45,40 C75,18 110,22 130,34 C150,46 165,22 190,30 C220,40 228,72 210,96 C195,115 170,122 150,118 C130,114 118,130 96,132 C78,134 62,130 50,120 Z"
        fill="currentColor"
        opacity="0.10"
      />

      <g
        transform="translate(52 36)"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      >
        <rect x="0" y="0" width="84" height="64" rx="14" opacity="0.9" />
        <path d="M42 6 v52" opacity="0.45" />
        <path d="M16 20 h18" opacity="0.55" />
        <path d="M16 34 h18" opacity="0.55" />
        <path d="M50 24 h18" opacity="0.55" />
        <path d="M50 38 h18" opacity="0.55" />
      </g>

      <g transform="translate(168 54)" fill="currentColor">
        <path d="M0 12 L12 0 L24 12 L12 24 Z" opacity="0.75">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </path>
        <circle cx="38" cy="10" r="4" opacity="0.45">
          <animate
            attributeName="opacity"
            values="0.2;0.6;0.2"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="34" cy="28" r="3" opacity="0.35">
          <animate
            attributeName="opacity"
            values="0.15;0.5;0.15"
            dur="1.0s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  );
}

export function PendingModal({
  open,
  srTitle,
  title,
  description,
  footer,
}: {
  open: boolean;
  srTitle: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal.Root open={open} onOpenChange={() => {}}>
      <Modal.Content
        srTitle={srTitle}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="text-base font-semibold">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-(--muted)">{description}</div>
          ) : null}

          <div className="mt-4 w-full rounded-2xl border border-(--border) bg-(--surface) p-4">
            <CuteLoadingSvg className="mx-auto h-28 w-full text-(--accent)" />
          </div>

          {footer ? (
            <div className="mt-4 text-xs text-(--muted)">{footer}</div>
          ) : null}
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}

