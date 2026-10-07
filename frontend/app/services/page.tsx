import { ProductCatalogPage } from "@/components/catalog/ProductCatalogPage";
import { SERVICE_SECTIONS } from "@/lib/mock/services";

export default function ServicesPage() {
  return <ProductCatalogPage sections={SERVICE_SECTIONS} />;
}
