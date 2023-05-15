"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, MenuProps } from "antd";
import { IconBrandGithub } from "@tabler/icons-react";

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