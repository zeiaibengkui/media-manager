import type { MediaRecord } from "../../../../src/shared/api-types.js";

export interface PhotoPointProperties {
  fileHash: string;
  fileName: string;
  title: string;
}

export interface PhotoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: PhotoPointProperties;
}

export interface PhotoFeatureCollection {
  type: "FeatureCollection";
  features: PhotoFeature[];
}

function asCoordinate(value: unknown, fallback?: unknown): number | null {
  const number = Number(value);
  if (Number.isFinite(number)) return number;
  if (!Array.isArray(value) || value.length < 3) return null;
  const degrees = Number(value[0]);
  const minutes = Number(value[1]);
  const seconds = Number(value[2]);
  if (![degrees, minutes, seconds].every(Number.isFinite)) return null;
  const result = degrees + minutes / 60 + seconds / 3600;
  return fallback === "S" || fallback === "W" ? -result : result;
}

export function buildPhotoFeatures(items: MediaRecord[]): PhotoFeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.flatMap((item) => {
      if (typeof item.exif !== "object" || item.exif === null) return [];
      const exif = item.exif as Record<string, unknown>;
      const latitude = asCoordinate(exif.latitude, exif.GPSLatitudeRef);
      const longitude = asCoordinate(exif.longitude, exif.GPSLongitudeRef);
      if (
        latitude === null ||
        longitude === null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return [];
      }
      return [{
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [longitude, latitude],
        },
        properties: {
          fileHash: item.fileHash,
          fileName: item.fileName,
          title: item.title ?? item.fileName,
        },
      }];
    }),
  };
}
