import { Drawer, DrawerProps } from "antd";
import { useMemo, useState } from "react";
import { useToggle } from 'react-use';


const useDrawer = ({ render, ...rest }: Omit<DrawerProps, 'children'> & { render: () => React.ReactNode }) => {
  const [isOpen, toggle] = useToggle(false);

  const drawer = useMemo(() => (
    <Drawer {...rest} title="设置" open={isOpen} onClose={(e) => { toggle(); rest.onClose && rest.onClose(e)} } >
      {render()}
    </Drawer>
  ), [isOpen, render, rest, toggle])

  return [drawer, { isOpen, toggle }] as const;
}

export { useDrawer }