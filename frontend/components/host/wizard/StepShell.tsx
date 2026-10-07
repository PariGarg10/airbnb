export function StepShell({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-6 py-10 min-[1128px]:py-12 ${wide ? "max-w-[720px] min-[1128px]:max-w-[780px]" : "max-w-[640px] min-[1128px]:max-w-[656px]"}`}
    >
      <h1 className="t-wizard-title min-[1128px]:text-[32px] min-[1128px]:leading-9">{title}</h1>
      {subtitle ? <p className="t-wizard-subtitle mt-3 min-[1128px]:mt-4">{subtitle}</p> : null}
      <div className="mt-8 min-[1128px]:mt-10">{children}</div>
    </div>
  );
}
