import { POSClient } from "@/components/pdv/pos-client";
import { Suspense } from "react";
import Loading from "../loading";

export default function POSPage() {
  return (
    <div className="h-screen-minus-navbar">
      <Suspense fallback={<Loading />}>
        <POSClient />
      </Suspense>
    </div>
  );
}
