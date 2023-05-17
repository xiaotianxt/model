"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Layout } from "antd";
import { Header } from "antd/es/layout/layout";
import NavigationMenu from "./Menu";
import ControlPanel from "./ControlPanel";

const DynamicMap = dynamic(async () => await import("./Map"), { ssr: false });

export default function Playground() {
  return (
    <Layout className="h-[100vh]">
      <Header className="bg-white shadow-sm">
        <NavigationMenu />
      </Header>
      <Layout className="p-2">
        <DynamicMap />
        <ControlPanel />
      </Layout>
    </Layout>
  );
}
