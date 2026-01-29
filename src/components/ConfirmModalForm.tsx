"use client";

import * as React from "react";
import { ModalFlat } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ConfirmModalForm({
  action,
  triggerLabel,
  triggerVariant = "secondary",
  triggerClassName,
  title,
  description,
  confirmLabel = "확인",
  closeLabel = "닫기",
  confirmVariant = "default",
}: {
  action: (formData: FormData) => void | Promise<void>;
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  closeLabel?: string;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  return (
    <form ref={formRef} action={action}>
      <ModalFlat
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        actionsDirection="column"
        closeButton
        closeText={closeLabel}
        trigger={
          <Button
            type="button"
            variant={triggerVariant}
            className={triggerClassName}
            onClick={() => setOpen(true)}
          >
            {triggerLabel}
          </Button>
        }
        actions={[
          {
            label: confirmLabel,
            variant: confirmVariant,
            onClick: () => {
              setOpen(false);
              formRef.current?.requestSubmit();
            },
          },
        ]}
      />
    </form>
  );
}

