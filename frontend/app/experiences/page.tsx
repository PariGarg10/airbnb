import { ProductCatalogPage } from "@/components/catalog/ProductCatalogPage";
import { EXPERIENCE_SECTIONS } from "@/lib/mock/experiences";

export default function ExperiencesPage() {
  return <ProductCatalogPage sections={EXPERIENCE_SECTIONS} />;
}
