type Props = {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function Section({ title, children, action }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
