import { StoreOrdersClient } from "@/components/store-orders/store-orders-client";
import { Suspense } from "react";
import Loading from "@/app/(admin)/loading-component";
import { storefrontUserId } from "@/firebase/config";
import { getSdks } from "@/firebase/server-init";
import { User, getAuth } from "firebase/auth";

export default async function StoreOrdersPage() {
  const { auth } = getSdks();
  const currentUser = auth.currentUser;
  
  const userIdsToFetch = [currentUser?.uid, storefrontUserId].filter(Boolean) as string[];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        <StoreOrdersClient userIds={userIdsToFetch} />
      </Suspense>
    </div>
  );
}
