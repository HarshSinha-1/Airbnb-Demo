export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-[480px] flex-col items-center justify-center py-20 text-center">
      {icon ? <div className="mb-6 text-text-secondary">{icon}</div> : null}
      <h2 className="text-[22px] font-semibold leading-7">{title}</h2>
      <p className="mt-3 text-base leading-6 text-text-secondary">{body}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
