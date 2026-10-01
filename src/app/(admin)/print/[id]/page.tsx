import { PrintClient } from "./print-client";

export default function PrintPage({ params }: { params: { id: string } }) {
  return <PrintClient id={params.id} />;
}
