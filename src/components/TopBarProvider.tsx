"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { TopBar, type TopBarConfig } from "@/components/TopBar";
import { cn } from "@/lib/utils";

type Ctx = {
  config: TopBarConfig;
  setConfig: (cfg: TopBarConfig) => void;
  resetToDefault: () => void;
};

const TopBarContext = createContext<Ctx | null>(null);

function defaultConfigForPath(pathname: string): TopBarConfig {
  if (pathname === "/app") return { title: "홈", backHref: null };
  if (pathname.startsWith("/app/vocab/"))
    return { title: "단어장", backHref: "/app/vocab" };
  if (pathname === "/app/vocab") return { title: "단어장", backHref: null };

  if (pathname.startsWith("/app/practice/"))
    return { title: "연습", backHref: "/app/practice" };
  if (pathname === "/app/practice") return { title: "연습", backHref: null };

  return { title: "Japanese Helper", backHref: null };
}

export function TopBarProvider({
  right,
  children,
}: {
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/app";

  const defaultCfg = useMemo(
    () => defaultConfigForPath(pathname),
    [pathname]
  );

  const [config, setConfigState] = useState<TopBarConfig>(defaultCfg);

  useEffect(() => {
    setConfigState(defaultCfg);
  }, [defaultCfg]);

  const setConfig = useCallback((cfg: TopBarConfig) => {
    setConfigState((prev) => ({ ...prev, ...cfg }));
  }, []);

  const resetToDefault = useCallback(() => {
    setConfigState(defaultCfg);
  }, [defaultCfg]);

  const ctx: Ctx = useMemo(
    () => ({
      config,
      setConfig,
      resetToDefault,
    }),
    [config, setConfig, resetToDefault]
  );

  return (
    <TopBarContext.Provider value={ctx}>
      <TopBar config={config} right={right} />
      <div className={cn("mx-auto w-full max-w-xl")}>{children}</div>
    </TopBarContext.Provider>
  );
}

export function TopBarConfig({
  title,
  subtitle,
  backHref,
}: TopBarConfig) {
  const ctx = useContext(TopBarContext);
  const setConfig = ctx?.setConfig;
  const resetToDefault = ctx?.resetToDefault;

  useEffect(() => {
    if (!setConfig) return;
    setConfig({ title, subtitle, backHref });
    return () => {
      // 페이지 이탈 시 기본값으로 복귀
      resetToDefault?.();
    };
  }, [setConfig, resetToDefault, title, subtitle, backHref]);

  return null;
}

