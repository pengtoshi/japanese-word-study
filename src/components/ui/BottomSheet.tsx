"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * BottomSheet (Compound primitives)
 * - Airbnb-ish styling (rounded, handle, soft overlay)
 * - Built on top of `vaul` Drawer
 */

export const BottomSheetRoot = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
BottomSheetRoot.displayName = "BottomSheetRoot";

export const BottomSheetTrigger = DrawerPrimitive.Trigger;
export const BottomSheetPortal = DrawerPrimitive.Portal;
export const BottomSheetClose = DrawerPrimitive.Close;

export const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/30",
      "backdrop-blur-[2px]",
      className
    )}
    {...props}
  />
));
BottomSheetOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    showHandle?: boolean;
    /**
     * Screen-reader only title.
     * Radix/vaul requires a DialogTitle for accessibility.
     */
    srTitle?: string;
  }
>(({ className, children, showHandle = true, srTitle = "바텀 시트", ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "outline-none",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-xl",
          "rounded-t-[28px] border border-b-0 border-[color:var(--border)] bg-[color:var(--surface)]",
          "shadow-[var(--shadow-float)]",
          "pb-[calc(env(safe-area-inset-bottom)+20px)]"
        )}
      >
        {showHandle ? <BottomSheetHandle /> : null}
        {/* Accessibility: DialogTitle is required */}
        <DrawerPrimitive.Title className="sr-only">{srTitle}</DrawerPrimitive.Title>
        <div className="px-6 pb-4 pt-2">{children}</div>
      </div>
    </DrawerPrimitive.Content>
  </BottomSheetPortal>
));
BottomSheetContent.displayName = "BottomSheetContent";

export function BottomSheetHandle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-center pt-3", className)} {...props}>
      <div
        aria-hidden="true"
        className={cn(
          "h-1.5 w-12 rounded-full",
          "bg-black/10 dark:bg-white/20"
        )}
      />
    </div>
  );
}

export function BottomSheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3",
        "pb-3",
        className
      )}
      {...props}
    />
  );
}

export function BottomSheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 flex flex-col gap-2", className)} {...props} />
  );
}

export const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold tracking-tight", className)}
    {...props}
  />
));
BottomSheetTitle.displayName = DrawerPrimitive.Title.displayName;

export const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("mt-1 text-sm text-[color:var(--muted)]", className)}
    {...props}
  />
));
BottomSheetDescription.displayName = DrawerPrimitive.Description.displayName;

/**
 * BottomSheet (Compound API with dot-notation)
 *
 * Example:
 *  <BottomSheet.Root>
 *    <BottomSheet.Trigger asChild>...</BottomSheet.Trigger>
 *    <BottomSheet.Content>
 *      <BottomSheet.Header>...</BottomSheet.Header>
 *    </BottomSheet.Content>
 *  </BottomSheet.Root>
 */
export const BottomSheet = {
  Root: BottomSheetRoot,
  Trigger: BottomSheetTrigger,
  Portal: BottomSheetPortal,
  Overlay: BottomSheetOverlay,
  Content: BottomSheetContent,
  Handle: BottomSheetHandle,
  Header: BottomSheetHeader,
  Footer: BottomSheetFooter,
  Title: BottomSheetTitle,
  Description: BottomSheetDescription,
  Close: BottomSheetClose,
} as const;

/**
 * BottomSheetFlat (Flat API)
 * - 기본적인 "제목 + 설명 + 내용 + 액션" 구성으로 바로 사용 가능
 */

export type BottomSheetAction = {
  label: string;
  onClick: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
  disabled?: boolean;
};

export type BottomSheetFlatProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  contents?: React.ReactNode;
  actions?: BottomSheetAction[];
  actionsDirection?: "row" | "column";
  closeButton?: boolean;
  closeText?: string;
  showCloseIcon?: boolean;
  contentClassName?: string;
};

export function BottomSheetFlat({
  trigger,
  title,
  description,
  contents,
  actions,
  actionsDirection = "row",
  closeButton = true,
  closeText = "닫기",
  showCloseIcon = true,
  contentClassName,
  shouldScaleBackground = true,
  ...rootProps
}: BottomSheetFlatProps) {
  const isRow = actionsDirection === "row";

  return (
    <BottomSheetRoot shouldScaleBackground={shouldScaleBackground} {...rootProps}>
      {trigger ? <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger> : null}

      <BottomSheetContent className={contentClassName}>
        {(title || description || showCloseIcon) && (
          <BottomSheetHeader>
            <div className="min-w-0">
              {title ? <BottomSheetTitle>{title}</BottomSheetTitle> : null}
              {description ? (
                <BottomSheetDescription>{description}</BottomSheetDescription>
              ) : null}
            </div>

            {showCloseIcon ? (
              <BottomSheetClose asChild>
                <button
                  type="button"
                  aria-label="닫기"
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "border border-[color:var(--border)] bg-[color:var(--surface)]",
                    "shadow-[var(--shadow-card)]",
                    "hover:bg-black/5 dark:hover:bg-white/10"
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </BottomSheetClose>
            ) : null}
          </BottomSheetHeader>
        )}

        {contents}

        {(closeButton || (actions && actions.length > 0)) && (
          <BottomSheetFooter>
            <div
              className={cn(
                "flex w-full",
                isRow ? "flex-row gap-3" : "flex-col gap-2"
              )}
            >
              {closeButton && isRow ? (
                <BottomSheetClose asChild>
                  <Button className="flex-1" variant="secondary">
                    {closeText}
                  </Button>
                </BottomSheetClose>
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
                <BottomSheetClose asChild>
                  <Button className="w-full" variant="ghost">
                    {closeText}
                  </Button>
                </BottomSheetClose>
              ) : null}
            </div>
          </BottomSheetFooter>
        )}
      </BottomSheetContent>
    </BottomSheetRoot>
  );
}

