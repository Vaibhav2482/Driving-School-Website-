import { Spinner } from "@/components/ui/Spinner";

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center text-brand-700">
      <Spinner label="Loading page" className="size-8" />
    </div>
  );
}
