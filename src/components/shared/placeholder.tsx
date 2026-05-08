import { Wrench } from "lucide-react";

type PlaceholderProps = {
  title: string;
  description?: string;
};

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="border-border bg-card text-card-foreground flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <Wrench className="text-muted-foreground size-8" />
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
