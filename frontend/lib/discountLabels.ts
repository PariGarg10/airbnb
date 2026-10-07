export function discountLineLabel(type: string | null | undefined): string {
  switch (type) {
    case "new_listing":
      return "New listing promotion";
    case "last_minute":
      return "Last-minute discount";
    case "weekly":
      return "Weekly discount";
    case "monthly":
      return "Monthly discount";
    default:
      return "Discount";
  }
}
