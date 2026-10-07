export function isGuestFavourite(listing: { avg_rating: number; review_count: number }): boolean {
  return listing.avg_rating >= 4.8 && listing.review_count >= 3;
}
