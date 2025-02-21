import { Suspense } from "react";
import { ProductFormSkeleton } from "@/components/products/loading";
import EditProductForm from "./edit-form";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <EditProductForm id={resolvedParams.id} />
    </Suspense>
  );
}
