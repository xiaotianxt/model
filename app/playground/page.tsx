"use client";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(async () => await import("./Map"), { ssr: false });
export default function Playground() {
  return (
    <main className="h-full">
      <DynamicMap />
    </main>
  );
}
