import { DeliveryClient } from "@/components/delivery/delivery-client";
import { Suspense } from "react";
import Loading from "@/app/(admin)/loading-component";

export default function DeliveryPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        <DeliveryClient />
      </Suspense>
    </div>
  );
}
