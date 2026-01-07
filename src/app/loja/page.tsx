import { StorefrontClient } from "@/components/loja/storefront-client";
import { Suspense } from "react";
import Loading from "./loading";

export default function StorefrontPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        <StorefrontClient />
      </Suspense>
    </div>
  );
}
