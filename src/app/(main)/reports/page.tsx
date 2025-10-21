import { ReportsClient } from "@/components/reports/reports-client";
import { Suspense } from "react";
import Loading from "../loading";

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        <ReportsClient />
      </Suspense>
    </div>
  );
}
