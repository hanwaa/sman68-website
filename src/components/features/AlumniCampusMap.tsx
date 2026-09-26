"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useContent } from "@/lib/use-content";
import { universityShortNames } from "@/lib/alumni-career";

type AlumniCampusMapProps = {
  counts: Record<string, number>;
  selectedName: string | null;
  onSelect: (name: string) => void;
};

type UniversityRow = {
  id: string;
  name: string;
  city: string | null;
  logo: string | null;
  lat: number | null;
  lng: number | null;
  alumniCount: number;
};

type Campus = {
  name: string;
  shortName: string;
  logo: string | null;
  lat: number;
  lng: number;
  alumniCount: number;
};

const INDONESIA_BOUNDS: L.LatLngBoundsExpression = [
  [-11.5, 94],
  [7, 141.5],
];

function makeIcon(campus: Campus, count: number, selected: boolean) {
  const logo = campus.logo;
  const pulse = selected
    ? `<span class="absolute -inset-2 rounded-full bg-brand-green/30 animate-ping"></span>`
    : "";
  const showLabel = selected || count >= 3;
  const label = showLabel
    ? `<span class="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-brand-pine text-white shadow-card">${campus.shortName}${count ? ` · ${count}` : ""}</span>`
    : "";
  const badge =
    count > 0
      ? `<span class="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-brand-pine text-white text-[9px] font-bold flex items-center justify-center border border-white">${count}</span>`
      : "";
  const inner = logo
    ? `<img src="${logo}" alt="" class="w-6 h-6 object-contain" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('bg-brand-leaf')" />`
    : `<span class="w-3.5 h-3.5 rounded-full bg-brand-leaf"></span>`;

  return L.divIcon({
    className: "sman68-marker",
    html: `<span class="relative flex items-center justify-center">
      ${pulse}
      <span class="relative w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-card ${selected ? "ring-2 ring-brand-lime border-2 border-brand-lime" : "border-2 border-white"}">
        ${inner}
      </span>
      ${badge}
      ${label}
    </span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function AlumniCampusMap({
  counts,
  selectedName,
  onSelect,
}: AlumniCampusMapProps) {
  const universityRows = useContent<UniversityRow[]>("universities", []);

  const campuses = useMemo<Campus[]>(
    () =>
      universityRows.flatMap((u) => {
        if (u.lat == null || u.lng == null) return [];
        return [
          {
            name: u.name,
            shortName: universityShortNames[u.name] ?? u.name,
            logo: u.logo ?? null,
            lat: u.lat,
            lng: u.lng,
            alumniCount: u.alumniCount,
          },
        ];
      }),
    [universityRows]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const onSelectRef = useRef(onSelect);

  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      zoomControl: false,
      scrollWheelZoom: false,
      minZoom: 3,
      maxBounds: [
        [-50, -25],
        [62, 155],
      ],
      maxBoundsViscosity: 1,
      worldCopyJump: true,
      attributionControl: false,
    });
    mapRef.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.fitBounds(INDONESIA_BOUNDS, { padding: [16, 16] });

    const invalidate = () => map.invalidateSize();
    const timer = setTimeout(invalidate, 200);
    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    campuses.forEach((campus) => {
      const count = counts[campus.name] ?? campus.alumniCount;
      const marker = L.marker([campus.lat, campus.lng], {
        icon: makeIcon(campus, count, selectedName === campus.name),
        riseOnHover: true,
        keyboard: true,
        title: `${campus.name} — klik untuk melihat alumni`,
        alt: campus.name,
      });
      marker.bindTooltip(`${campus.name} — ${count} alumni`, {
        direction: "top",
        offset: [0, -10],
        className: "sman68-tip",
      });
      marker.on("click", () => onSelectRef.current(campus.name));
      marker.addTo(map);
      markersRef.current[campus.name] = marker;
    });
  }, [campuses, counts, selectedName]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedName) return;
    const campus = campuses.find((c) => c.name === selectedName);
    if (!campus) return;
    map.flyTo([campus.lat, campus.lng], 8, { duration: 0.9 });
  }, [campuses, selectedName]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Peta kampus alumni SMAN 68 Jakarta"
    />
  );
}
