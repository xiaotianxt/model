import { useDrawer } from "@/components/drawer";
import { IconAdjustmentsAlt } from "@tabler/icons-react";
import { Button, Drawer, Form, FormProps, Radio, Slider, Switch } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import { FC, useEffect } from "react";
import { EAlgorithm } from "../types/enum";
import { SliderMarks } from "antd/es/slider";
import { useToggle } from "react-use";
import { useConfigStore } from "../store/config";

const Item = Form.Item;

interface Parameter {
  horizontalDensity: number;
  verticalDensity: number;
}

export interface ControlFormValue {
  algorithm: EAlgorithm;
  parameter: Parameter;
  showGrid: boolean;
  showContour: boolean;
  smoothContour?: boolean;
}

interface AlgorithmParameterFormProps {
  algorithm: EAlgorithm;
  value?: Parameter;
  onChange?: (value: Parameter) => void;
}

// antd custom controled input component
const AlgorithmParameter: FC<AlgorithmParameterFormProps> = ({
  algorithm,
  value,
  onChange,
}) => {
  if (algorithm === EAlgorithm.IRREGULAR_TRIANGLES) {
    return (
      <>
        <Item label="某些参数">
          <Slider />
        </Item>
      </>
    );
  }

  const marks: SliderMarks = {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    60: "60",
    70: "70",
    80: "80",
    90: "90",
    100: "100",
  };

  return (
    <>
      <Item
        label="横向密度"
        name={["parameter", "horizontalDensity"]}
        initialValue={10}
      >
        <Slider marks={marks} min={1} max={100} />
      </Item>

      <Item
        label="纵向密度"
        name={["parameter", "verticalDensity"]}
        initialValue={10}
      >
        <Slider marks={marks} min={1} max={100} />
      </Item>
    </>
  );
};

const ControlPanel: FC<Omit<FormProps, "children">> = ({ ...props }) => {
  const [form] = useForm<ControlFormValue>();
  const algorithm = useWatch("algorithm", form);
  const showContour = useWatch("showContour", form);
  const [open, toggle] = useToggle(false);

  const { update, config } = useConfigStore();

  useEffect(() => {
    form.setFieldsValue(config);
    // intentionally ignore the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showConfig = () => {
    toggle();
  };

  return (
    <>
      <div
        onClick={showConfig}
        className="absolute right-[4rem] bottom-6
        text-lg p-2 bg-white hover:bg-slate-100 shadow-md
        transition-transform ease-in-out hover:scale-125
        rounded-full border-[#b0b0b0] border-2"
      >
        <IconAdjustmentsAlt size="1.8rem" />
      </div>
      <Drawer title="设置" width={720} open={open} onClose={toggle}>
        <Form
          form={form}
          onValuesChange={(e) => {
            form.validateFields().then((values) => update({ config: values }));
          }}
        >
          <Item
            label="算法"
            name="algorithm"
            initialValue={EAlgorithm.INVERSE_SQUARE_DISTANCE}
          >
            <Radio.Group
              options={[
                {
                  label: "距离平方倒数法",
                  value: EAlgorithm.INVERSE_SQUARE_DISTANCE,
                },
                {
                  label: "按方位加权平均法",
                  value: EAlgorithm.WEIGHTED_AVERAGE_BY_ORIENTATION,
                },
                {
                  label: "TIN 不规则三角网",
                  value: EAlgorithm.IRREGULAR_TRIANGLES,
                },
              ]}
            />
          </Item>
          <Form.Item label="参数" name="parameter">
            <AlgorithmParameter algorithm={algorithm} />
          </Form.Item>
          <Item
            label="显示格网"
            name="showGrid"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Item>
          <Item
            label="显示等值线"
            name="showContour"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Item>
          <Item label="等值线类型" name="smoothContour" initialValue={false}>
            <Radio.Group
              options={[
                { label: "光滑", value: true },
                { label: "折线", value: false },
              ]}
              disabled={!showContour}
            ></Radio.Group>
          </Item>
        </Form>
      </Drawer>
    </>
  );
};

export default ControlPanel;
