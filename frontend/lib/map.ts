const key = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();

/** Shared Leaflet basemap: MapTiler Dataviz when keyed, otherwise OpenStreetMap. */
export const TILE_LAYER = key
  ? {
      url: `https://api.maptiler.com/maps/dataviz/256/{z}/{x}/{y}.png?key=${key}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }
  : {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
