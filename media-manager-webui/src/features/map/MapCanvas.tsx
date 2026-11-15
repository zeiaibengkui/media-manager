import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import {
  LngLatBounds,
  Map,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  PhotoFeatureCollection,
  PhotoPointProperties,
} from "./photo-features.js";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(workerUrl);

interface Props {
  data: PhotoFeatureCollection;
  onPhotoSelect: (photo: PhotoPointProperties) => void;
}

const SOURCE_ID = "photos";

export function MapCanvas({ data, onPhotoSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    const map = new Map({
      container: container.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [104, 35],
      zoom: 3,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl(), "top-right");
    const markReady = (): void => setReady(true);
    map.on("style.load", markReady);
    if (map.isStyleLoaded()) setReady(true);
    mapRef.current = map;
    return () => {
      map.off("style.load", markReady);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    } else {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#1a73e8",
          "circle-radius": ["step", ["get", "point_count"], 18, 20, 26, 100, 34],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 },
      });
      map.addLayer({
        id: "photo-points",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#188038",
          "circle-radius": 6,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }

    if (!fitted.current && data.features.length > 0) {
      fitted.current = true;
      const bounds = new LngLatBounds();
      data.features.forEach((feature) => bounds.extend(feature.geometry.coordinates as [number, number]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
    }
  }, [data, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const zoomCluster = async (event: MapLayerMouseEvent): Promise<void> => {
      const feature = event.features?.[0];
      if (!feature) return;
      const source = map.getSource(SOURCE_ID) as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(Number(feature.properties?.cluster_id));
      map.easeTo({ center: event.lngLat, zoom });
    };
    const showPhoto = (event: MapLayerMouseEvent): void => {
      const feature = event.features?.[0];
      if (!feature) return;
      onPhotoSelect({
        fileHash: String(feature.properties?.fileHash ?? ""),
        fileName: String(feature.properties?.fileName ?? ""),
        title: String(feature.properties?.title ?? "Photo"),
      });
    };
    map.on("click", "clusters", zoomCluster);
    map.on("click", "photo-points", showPhoto);
    return () => {
      map.off("click", "clusters", zoomCluster);
      map.off("click", "photo-points", showPhoto);
    };
  }, [onPhotoSelect, ready]);

  return <Box ref={container} sx={{ width: "100%", height: "100%", minHeight: 420 }} />;
}
