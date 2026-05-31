import type { Metadata } from "next";
import { MapExplorer } from "@/components/map/map-explorer";

export const metadata: Metadata = {
  title: "Explore Map",
  description: "Overlay and filter community-generated geographic datasets."
};

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-57px)] min-h-[680px]">
      <MapExplorer className="h-full min-h-full" />
    </div>
  );
}

