
interface SettingsHeaderProps {
  title: string;
  description: string;
}

export const SettingsHeader = ({ title, description }: SettingsHeaderProps) => {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-bold mb-3 text-zinc-800">{title}</h1>
      <p className="text-base font-normal text-zinc-800">
        {description}
      </p>
    </header>
  );
};
