import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <ShieldAlert className="text-destructive size-10" />
        <h1 className="text-2xl font-semibold">Forbidden</h1>
        <p className="text-muted-foreground text-sm">
          Your account doesn&apos;t have access to this area.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
