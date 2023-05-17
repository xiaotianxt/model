"use client"

import * as React from "react"
import { Menu, MenuProps } from "antd";

const items: MenuProps["items"] = [
  {
    label: "主页",
    key: "home",
  },
  {
    label: "演示",
    key: "playground",
    onClick: () => {},
  },
  {
    label: "代码",
    key: "sourceCode",
  },
];

function NavigationMenu() {
  return (
    <>
      <Menu mode="horizontal" items={items} />
    </>
  );
}

export default NavigationMenu;