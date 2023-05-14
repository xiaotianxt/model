"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const DynamicMap = dynamic(async () => await import("./Map"), { ssr: false });
const DynamicMenu = dynamic(async () => await import("./Menu"), { ssr: false });

export default function Playground() {
  return (
    <main className="h-full">
      <DynamicMenu />
      <DynamicMap />
    </main>
  );
}
