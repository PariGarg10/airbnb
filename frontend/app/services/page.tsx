import { ProductCatalogPage } from "@/components/catalog/ProductCatalogPage";
import { SERVICE_SECTIONS } from "@/lib/catalogSections";

export default function ServicesPage() {
  return <ProductCatalogPage category="Services" sections={SERVICE_SECTIONS} />;
}
