import { ProductCatalogPage } from "@/components/catalog/ProductCatalogPage";
import { EXPERIENCE_SECTIONS } from "@/lib/catalogSections";

export default function ExperiencesPage() {
  return <ProductCatalogPage category="Experiences" sections={EXPERIENCE_SECTIONS} />;
}
