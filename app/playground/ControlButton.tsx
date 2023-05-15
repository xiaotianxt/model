import { Button, ButtonProps } from "antd";

export default function Control(props: ButtonProps) {
  return (
    <Button className="absolute right-6 bottom-6 z-10" {...props}>
      设置
    </Button>
  );
}
