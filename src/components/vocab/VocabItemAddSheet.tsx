"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getLastUsedVocabListId, setLastUsedVocabListId } from "@/components/vocab/lastUsedList";
import type { VocabItemCreateActionState, VocabListOption } from "@/components/vocab/types";
import { VocabItemForm } from "@/components/vocab/VocabItemForm";

type Props =
  | {
      mode: "fixed";
      fixedListId: string;
      action: (
        prevState: VocabItemCreateActionState,
        formData: FormData
      ) => Promise<VocabItemCreateActionState>;
      triggerClassName?: string;
      triggerLabel?: string;
    }
  | {
      mode: "select";
      action: (
        prevState: VocabItemCreateActionState,
        formData: FormData
      ) => Promise<VocabItemCreateActionState>;
      triggerClassName?: string;
      triggerLabel?: string;
    };

function SelectListField({
  options,
  value,
  onChange,
}: {
  options: VocabListOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">단어장</span>
      </div>
      <div>
        <Select
          name="listId"
          value={value}
          onValueChange={onChange}
          options={options.map((o) => ({ value: o.id, label: o.name }))}
          placeholder="단어장을 선택해주세요"
        />
      </div>
    </label>
  );
}

export function VocabItemAddSheet(props: Props) {
  const [open, setOpen] = React.useState(false);

  const [lists, setLists] = React.useState<VocabListOption[]>([]);
  const [listsError, setListsError] = React.useState<string | null>(null);
  const [selectedListId, setSelectedListId] = React.useState<string>("");

  // load lists only for select mode
  React.useEffect(() => {
    if (props.mode !== "select") return;
    if (!open) return;

    let cancelled = false;
    (async () => {
      setListsError(null);
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("vocab_lists")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setListsError(error.message);
        setLists([]);
        return;
      }

      const options = (data ?? []).map((r) => ({
        id: String(r.id),
        name: String(r.name),
      }));
      setLists(options);

      const last = getLastUsedVocabListId();
      const defaultId =
        (last && options.some((o) => o.id === last) ? last : options[0]?.id) ?? "";
      setSelectedListId(defaultId);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, props.mode]);

  const triggerLabel = props.triggerLabel ?? "단어 추가";

  return (
    <BottomSheet.Root open={open} onOpenChange={setOpen}>
      <BottomSheet.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-full px-4",
            "bg-(--accent) text-white shadow-(--shadow-float)",
            "hover:bg-rose-600",
            props.triggerClassName
          )}
          aria-label={triggerLabel}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold">{triggerLabel}</span>
        </button>
      </BottomSheet.Trigger>

      <BottomSheet.Content>
        <div className="pb-4 pt-2">
          <span className="font-semibold">표현 추가</span>
        </div>

        {props.mode === "select" ? (
          listsError ? (
            <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-red-700">
              단어장 목록을 불러오지 못했어요: {listsError}
            </div>
          ) : lists.length === 0 ? (
            <div className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--muted)">
              단어장이 없어요. 먼저 단어장을 만든 뒤 추가할 수 있어요.
            </div>
          ) : (
            <VocabItemForm
              action={props.action}
              beforeFields={
                <div className="pb-2">
                  <SelectListField
                    options={lists}
                    value={selectedListId}
                    onChange={setSelectedListId}
                  />
                </div>
              }
              onResult={(s) => {
                if (s.status === "success") {
                  if (selectedListId) setLastUsedVocabListId(selectedListId);
                  toast({ type: "success", title: "추가했어요" });
                  setOpen(false);
                } else if (s.status === "error") {
                  toast({
                    type: "error",
                    title: "추가 실패",
                    description: s.message ?? "저장 중 오류가 발생했어요.",
                  });
                }
              }}
            />
          )
        ) : (
          <VocabItemForm
            action={props.action}
            onResult={(s) => {
              if (s.status === "success") {
                setLastUsedVocabListId(props.fixedListId);
                toast({ type: "success", title: "추가했어요" });
                setOpen(false);
              } else if (s.status === "error") {
                toast({
                  type: "error",
                  title: "추가 실패",
                  description: s.message ?? "저장 중 오류가 발생했어요.",
                });
              }
            }}
          />
        )}
      </BottomSheet.Content>
    </BottomSheet.Root>
  );
}

