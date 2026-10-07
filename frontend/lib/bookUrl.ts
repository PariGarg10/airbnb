export interface BookStayGuests {
  adults: number;
  children?: number;
  infants?: number;
  pets?: number;
}

export function buildBookQuery(
  checkIn: string,
  checkOut: string,
  guests: BookStayGuests,
  coupon?: string,
): string {
  const params = new URLSearchParams();
  params.set("check_in", checkIn);
  params.set("check_out", checkOut);
  params.set("adults", String(Math.max(1, guests.adults)));
  const children = guests.children ?? 0;
  const infants = guests.infants ?? 0;
  const pets = guests.pets ?? 0;
  if (children > 0) params.set("children", String(children));
  if (infants > 0) params.set("infants", String(infants));
  if (pets > 0) params.set("pets", String(pets));
  if (coupon) params.set("coupon", coupon);
  return params.toString();
}

export function bookHref(listingId: number, checkIn: string, checkOut: string, guests: BookStayGuests, coupon?: string): string {
  return `/book/${listingId}?${buildBookQuery(checkIn, checkOut, guests, coupon)}`;
}
