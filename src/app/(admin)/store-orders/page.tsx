'use client'; // Marcar como Client Component

import { StoreOrdersClient } from "@/components/store-orders/store-orders-client";
import { Suspense } from "react";
import Loading from "@/app/(admin)/loading-component";
import { storefrontUserId } from "@/firebase/config";
import { useUser } from "@/firebase"; // Usar o hook de cliente

export default function StoreOrdersPage() {
  const { user, isUserLoading } = useUser(); // Obter o usuário do lado do cliente

  // Determinar os IDs a serem buscados apenas quando o usuário estiver carregado
  const userIdsToFetch = !isUserLoading && user 
    ? [user.uid, storefrontUserId].filter(Boolean) as string[]
    : [];

  // Mostrar o loading enquanto o usuário está sendo verificado
  if (isUserLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        {/* Passar os IDs apenas quando disponíveis */}
        <StoreOrdersClient userIds={userIdsToFetch} />
      </Suspense>
    </div>
  );
}
