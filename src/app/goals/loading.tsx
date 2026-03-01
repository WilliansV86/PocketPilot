import { PageSkeleton } from "@/components/ui/skeleton-loader";

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageSkeleton 
        showHeader={true} 
        showStats={false} 
        showCards={true} 
        showTable={false} 
      />
    </div>
  );
}
