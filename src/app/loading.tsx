import { InstantLoader } from "@/components/ui/instant-loader";

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <InstantLoader type="page" />
    </div>
  );
}
