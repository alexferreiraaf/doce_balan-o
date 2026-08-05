import { StorefrontClient } from "@/components/loja/storefront-client";
import { Suspense } from "react";
import Loading from "./loading";
import { getSdks } from "@/firebase/server-init";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { APP_ID } from "@/app/lib/constants";

export const revalidate = 60; // Cache ISR revalidado no servidor a cada 60 segundos

// Cache em memória no servidor para eliminar latência de rede nas requisições da loja
let cachedData: {
  products: any[];
  categories: any[];
  settings: any;
  timestamp: number;
} | null = null;

let isBackgroundFetching = false;
const CACHE_TTL_MS = 30000; // 30 segundos

async function fetchFromFirestore() {
  const { firestore } = getSdks();
  const [productsSnap, categoriesSnap, settingsSnap] = await Promise.all([
    getDocs(query(collection(firestore, `artifacts/${APP_ID}/products`), orderBy('name', 'asc'))),
    getDocs(query(collection(firestore, `artifacts/${APP_ID}/product-categories`), orderBy('name', 'asc'))),
    getDoc(doc(firestore, `artifacts/${APP_ID}/settings`, 'app'))
  ]);

  return {
    products: productsSnap.docs.map(d => ({ ...d.data(), id: d.id })),
    categories: categoriesSnap.docs.map(d => ({ ...d.data(), id: d.id })),
    settings: settingsSnap.exists() ? settingsSnap.data() : null,
  };
}

async function getStorefrontData() {
  const now = Date.now();

  // Se já temos os dados cacheados em memória no servidor, retorna em 0 milisegundos sem esperar a rede
  if (cachedData) {
    // Stale-While-Revalidate: se expirado, revalida os dados em background sem travar a navegação do usuário
    if (now - cachedData.timestamp > CACHE_TTL_MS && !isBackgroundFetching) {
      isBackgroundFetching = true;
      fetchFromFirestore()
        .then(data => {
          cachedData = { ...data, timestamp: Date.now() };
        })
        .catch(err => console.error("Erro na revalidação em background do cache da loja:", err))
        .finally(() => {
          isBackgroundFetching = false;
        });
    }
    return cachedData;
  }

  // Na primeira carga do servidor (quando cache está vazio), iniciamos a busca no Firebase e garantimos que
  // ela salve no cache em memória assim que concluir (mesmo que estoure o tempo limite de resposta da página)
  if (!isBackgroundFetching) {
    isBackgroundFetching = true;
    fetchFromFirestore()
      .then(data => {
        cachedData = { ...data, timestamp: Date.now() };
      })
      .catch(err => console.error("Erro na busca do cache da loja:", err))
      .finally(() => {
        isBackgroundFetching = false;
      });
  }

  // Limitamos a espera da primeira requisição em 1.5 segundo. Se o Node/Firebase demorar mais que isso,
  // a página é enviada rapidamente ao navegador com fallback para carregamento Instantâneo via cliente!
  try {
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (cachedData || !isBackgroundFetching) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 50);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 1500);
    });
  } catch (error) {
    console.warn("Abertura rápida ativada (fallback de carregamento no cliente):", error);
  }

  return cachedData || { products: [], categories: [], settings: null, timestamp: now };
}

export default async function StorefrontPage() {
  const data = await getStorefrontData();

  const cleanProducts = JSON.parse(JSON.stringify(data.products || []));
  const cleanCategories = JSON.parse(JSON.stringify(data.categories || []));
  const cleanSettings = JSON.parse(JSON.stringify(data.settings || {}));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loading />}>
        <StorefrontClient 
          initialProducts={cleanProducts}
          initialCategories={cleanCategories}
          initialSettings={cleanSettings}
        />
      </Suspense>
    </div>
  );
}
