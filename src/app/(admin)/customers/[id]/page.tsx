import { CustomerDetailsClient } from "@/components/customers/customer-details-client";
import { Suspense } from "react";
import Loading from "@/app/(admin)/loading-component";

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        <CustomerDetailsClient customerId={params.id} />
      </Suspense>
    </div>
  );
}
