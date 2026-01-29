import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[color:var(--background)] px-4 py-6 text-[color:var(--foreground)]">
          <div className="mx-auto w-full max-w-xl">
            <Card>
              <div className="text-sm text-[color:var(--muted)]">
                로딩 중...
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
