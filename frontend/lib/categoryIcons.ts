import {
  Building2,
  Castle,
  Flame,
  Hotel,
  House,
  Lamp,
  Mountain,
  Sailboat,
  Sparkles,
  Sprout,
  Tent,
  TreePine,
  Trees,
  Umbrella,
  WavesLadder,
  type LucideIcon,
} from "lucide-react";
import type { PropertyType } from "@/types";

export const categoryIcons: Record<string, LucideIcon> = {
  Beachfront: Umbrella,
  Trending: Flame,
  "Amazing pools": WavesLadder,
  "Tiny homes": House,
  Cabins: TreePine,
  "Amazing views": Mountain,
  Treehouses: Trees,
  Countryside: Sprout,
  Design: Lamp,
  Castles: Castle,
  Lakefront: Sailboat,
  "OMG!": Sparkles,
};

export function iconForCategory(name: string): LucideIcon {
  return categoryIcons[name] ?? House;
}

export const propertyTypeIcons: Record<PropertyType, LucideIcon> = {
  house: House,
  apartment: Building2,
  villa: House,
  cabin: TreePine,
  guesthouse: Hotel,
  hotel: Building2,
  cottage: House,
  tiny_home: Tent,
  treehouse: Trees,
  castle: Castle,
};
