"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, Layout } from "antd";
import { Header } from "antd/es/layout/layout";
import NavigationMenu from "./Menu";
import ControlPanel from "./ControlPanel";
import Sider from "antd/es/layout/Sider";

const NativeMap = dynamic(async () => await import("./NativeMap"), {
  ssr: false,
});

export default function Playground() {
  const [configCollapsed, setConfigCollapsed] = useState(false);
  return (
    <Layout className="h-[100vh]" hasSider>
      <Layout>
        <Header className="bg-white shadow-sm">
          <NavigationMenu />
        </Header>
        <NativeMap />
      </Layout>
      <Sider
        style={{
          backgroundColor: "transparent",
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: "14px",
          fontWeight: 300,
          letterSpacing: "0.025em",
          textTransform: "uppercase",
          lineHeight: 1.5,
        }}
        collapsible
        width="400"
        onCollapse={setConfigCollapsed}
      >
        {configCollapsed ? (
          <Card className="w-full h-full text-lg">点击展开设置</Card>
        ) : (
          <ControlPanel />
        )}
      </Sider>
    </Layout>
  );
}
