"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import ControlButton from "./ControlButton";
import { Layout, Menu, Switch } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import NavigationMenu from "./Menu";
import ControlPanel from "./ControlPanel";

const DynamicMap = dynamic(async () => await import("./Map"), { ssr: false });

export default function Playground() {
  const [isOpen, setOpen] = useState(false);
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
