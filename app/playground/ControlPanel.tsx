import { useDrawer } from "@/components/drawer";
import { IconAdjustmentsAlt } from "@tabler/icons-react";
import {
  Button,
  Checkbox,
  Form,
  FormProps,
  Radio,
  Select,
  Slider,
  Switch,
} from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import { FC } from "react";

const Item = Form.Item;

enum EAlgorithm {
  IRREGULAR_TRIANGLES = "IRREGULAR_TRIANGLES",
  INVERSE_SQUARE_DISTANCE = "INVERSE_SQUARE_DISTANCE",
  WEIGHTED_AVERAGE_BY_ORIENTATION = "WEIGHTED_AVERAGE_BY_ORIENTATION",
}

interface AlgorithmParameterFormProps {
  algorithm: EAlgorithm;
}

// antd custom controled input component
const AlgorithmParameter: FC<AlgorithmParameterFormProps> = ({ algorithm }) => {
  console.log(algorithm);
  if (algorithm === EAlgorithm.IRREGULAR_TRIANGLES) {
    return (
      <>
        <Item label="某些参数">
          <Slider />
        </Item>
      </>
    );
  }

  return (
    <>
      <Item label="横向密度" name="horizontalDensity" initialValue={10}>
        <Slider min={1} max={100} />
      </Item>

      <Item label="纵向密度" name="verticalDensity" initialValue={10}>
        <Slider min={1} max={100} />
      </Item>
    </>
  );
};

const ControlPanel: FC<Omit<FormProps, "children">> = ({ ...props }) => {
  const [form] = useForm();
  const algorithm = useWatch('algorithm', form);

  const formNode = (
    <Form form={form} {...props}>
      <Item>
        <Button type="primary" htmlType="submit" onClick={() => {}}>
          提交
        </Button>
      </Item>
    </Form>
  );

  const [drawer, { toggle }] = useDrawer({
    render: () => {
      return (
        <Form form={form}>
          <Item label="算法" name="algorithm">
            <Radio.Group
              options={[
                { label: "TIN 不规则三角网", value: "IRREGULAR_TRIANGLES" },
                { label: "距离平方倒数法", value: "INVERSE_SQUARE_DISTANCE" },
                {
                  label: "按方位加权平均法",
                  value: "WEIGHTED_AVERAGE_BY_ORIENTATION",
                },
              ]}
            />
          </Item>
          <Form.Item label="参数" name="parameter">
            <AlgorithmParameter algorithm={algorithm} />
          </Form.Item>
          <Item label="显示格网">
            <Switch />
          </Item>
          <Item label="显示等值线" name="showContour">
            <Switch />
          </Item>
          <Item
            label="等值线类型"
            name="contourType"
            dependencies={["showContour"]}
          >
            <Radio.Group
              options={[
                { label: "光滑", value: true },
                { label: "折线", value: false },
              ]}
              disabled={form.getFieldValue("showContour") === false}
            ></Radio.Group>
          </Item>
        </Form>
      );
    },
  });

  const showConfig = () => {
    toggle();
  };

  return (
    <>
      <div
        onClick={showConfig}
        className="transition-transform hover:scale-125 ease-in-out rounded-full absolute right-[4rem] bottom-6 bg-white p-2 hover:bg-slate-100 text-lg shadow-md border-[#b0b0b0] border-solid border-2"
      >
        <IconAdjustmentsAlt size="1.8rem" />
      </div>
      {drawer}
    </>
  );
};

export default ControlPanel;
