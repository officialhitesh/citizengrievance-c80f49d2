import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths (Vite breaks them)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const ClickHandler = ({ onChange }: { onChange: Props["onChange"] }) => {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

const Recenter = ({ pos }: { pos: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 14, { duration: 0.8 });
  }, [pos, map]);
  return null;
};

const LocationPicker = ({ value, onChange }: Props) => {
  const center: [number, number] = value ? [value.lat, value.lng] : [20.5937, 78.9629]; // India center

  return (
    <div className="rounded-xl overflow-hidden border border-border h-72 relative z-0">
      <MapContainer center={center} zoom={value ? 14 : 5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
        />
        <ClickHandler onChange={onChange} />
        <Recenter pos={value} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
