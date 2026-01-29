"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

import { Toast, type ToastProps } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export type ToasterProps = React.ComponentProps<typeof SonnerToaster> & {
  className?: string;
};

export function Toaster({ className, ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-center"
      className={cn("font-sans", className)}
      toastOptions={{
        // headless(= custom toast)도 쓸 거지만, 기본 toast도 스타일이 어긋나지 않게 맞춰둠
        className: cn(
          "rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]",
          "shadow-[var(--shadow-float)]"
        ),
      }}
      {...props}
    />
  );
}

/**
 * sonner의 custom toast를 우리 UI로 감싼 helper
 * https://sonner.emilkowal.ski/styling#headless
 */
export function toast(toastProps: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => <Toast {...toastProps} id={id} />);
}

