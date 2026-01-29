"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Modal (Compound primitives)
 * - Airbnb-ish styling (soft overlay, rounded, float shadow)
 * - Built on top of Radix Dialog
 */

export const ModalRoot = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalPortal = DialogPrimitive.Portal;
export const ModalClose = DialogPrimitive.Close;

export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/30",
      "backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /**
     * Screen-reader only title.
     * Radix requires a DialogTitle for accessibility.
     */
    srTitle?: string;
    size?: "sm" | "md";
  }
>(({ className, children, srTitle = "모달", size = "sm", ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 outline-none",
        size === "sm" ? "max-w-[360px]" : "max-w-[520px]",
        "rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]",
        "shadow-[var(--shadow-float)]",
        "p-5",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    >
      <DialogPrimitive.Title className="sr-only">{srTitle}</DialogPrimitive.Title>
      {children}
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

export function ModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)} {...props} />
  );
}

export function ModalFooter({
  className,
  direction = "row",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { direction?: "row" | "column" }) {
  return (
    <div
      className={cn(
        "mt-4 flex w-full",
        direction === "row" ? "flex-row gap-3" : "flex-col gap-2",
        className
      )}
      {...props}
    />
  );
}

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold tracking-tight", className)}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("mt-1 text-sm text-[color:var(--muted)]", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * Modal (Compound API with dot-notation)
 */
export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Portal: ModalPortal,
  Overlay: ModalOverlay,
  Content: ModalContent,
  Header: ModalHeader,
  Footer: ModalFooter,
  Title: ModalTitle,
  Description: ModalDescription,
  Close: ModalClose,
} as const;

/**
 * ModalFlat (Flat API)
 * - 기본적인 "제목 + 설명 + 내용 + 액션" 구성으로 바로 사용 가능
 */
export type ModalAction = {
  label: string;
  onClick: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
  disabled?: boolean;
};

export type ModalFlatProps = React.ComponentProps<typeof DialogPrimitive.Root> & {
  trigger?: React.ReactNode;
  size?: "sm" | "md";
  title?: React.ReactNode;
  description?: React.ReactNode;
  contents?: React.ReactNode;
  actions?: ModalAction[];
  actionsDirection?: "row" | "column";
  closeButton?: boolean;
  closeText?: string;
  showCloseIcon?: boolean;
  contentClassName?: string;
};

export function ModalFlat({
  trigger,
  size = "sm",
  title,
  description,
  contents,
  actions,
  actionsDirection = "row",
  closeButton = true,
  closeText = "닫기",
  showCloseIcon = true,
  contentClassName,
  ...rootProps
}: ModalFlatProps) {
  const isRow = actionsDirection === "row";

  return (
    <ModalRoot {...rootProps}>
      {trigger ? <ModalTrigger asChild>{trigger}</ModalTrigger> : null}

      <ModalContent
        size={size}
        className={contentClassName}
        srTitle={typeof title === "string" ? title : "모달"}
      >
        {(title || description || showCloseIcon) && (
          <ModalHeader>
            <div className="min-w-0">
              {title ? <ModalTitle>{title}</ModalTitle> : null}
              {description ? (
                <ModalDescription>{description}</ModalDescription>
              ) : null}
            </div>

            {showCloseIcon ? (
              <ModalClose asChild>
                <button
                  type="button"
                  aria-label="닫기"
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "bg-transparent",
                    "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                    "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </ModalClose>
            ) : null}
          </ModalHeader>
        )}

        {contents}

        {(closeButton || (actions && actions.length > 0)) && (
          <ModalFooter direction={actionsDirection}>
            {closeButton && isRow ? (
              <ModalClose asChild>
                <Button className="flex-1" variant="secondary">
                  {closeText}
                </Button>
              </ModalClose>
            ) : null}

            {actions?.map((action) => (
              <Button
                key={action.label}
                className={cn(isRow ? "flex-1" : "w-full")}
                onClick={action.onClick}
                variant={action.variant ?? "default"}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}

            {closeButton && !isRow ? (
              <ModalClose asChild>
                <Button className="w-full" variant="secondary">
                  {closeText}
                </Button>
              </ModalClose>
            ) : null}
          </ModalFooter>
        )}
      </ModalContent>
    </ModalRoot>
  );
}

