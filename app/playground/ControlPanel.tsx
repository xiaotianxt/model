import {
  Button,
  Card,
  Form,
  FormProps,
  Radio,
  Row,
  Slider,
  Space,
  Switch,
} from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import React, { FC, useCallback, useEffect, useState } from "react";
import { EAlgorithm, EDisplayMode } from "../types/enum";
import { SliderMarks } from "antd/es/slider";
import { useDebounce, useToggle } from "react-use";
import { useConfigStore } from "../store/config";
import FormItem from "antd/es/form/FormItem";

const Item = Form.Item;

interface Parameter {
  horizontalDensity: number;
  verticalDensity: number;
}

export interface ControlFormValue {
  algorithm: EAlgorithm;
  parameter: Parameter;
  showContour: boolean;
  smoothContour?: boolean;
  contourCount?: number;
}

interface AlgorithmParameterFormProps {
  algorithm: EAlgorithm;
}

// antd custom controled input component
const AlgorithmParameter: FC<AlgorithmParameterFormProps> = ({ algorithm }) => {
  const [bindDensities, setBindDensities] = useToggle(false);

  // 绑定参数处理
  const form = Form.useFormInstance();

  const handleBindDensityChange = useCallback(
    (checked: boolean) => {
      setBindDensities(checked);
      checked &&
        form.setFieldsValue({
          parameter: {
            verticalDensity: form.getFieldValue([
              "parameter",
              "horizontalDensity",
            ]),
          },
        });
    },
    [form, setBindDensities]
  );

  const handleHorizontalDensityChange = useCallback(
    (val: number) => {
      if (bindDensities) {
        form.setFieldsValue({
          parameter: {
            horizontalDensity: val,
            verticalDensity: val,
          },
        });
      }
    },
    [bindDensities, form]
  );

  if (algorithm === EAlgorithm.IRREGULAR_TRIANGLES) {
    return <></>;
  }

  const marks: SliderMarks = {
    [0.1]: "0.1",
    [0.3]: "0.3",
    [0.5]: "0.5",
    [0.7]: "0.7",
    [0.9]: "0.9",
  };

  return (
    <>
      <Item label="横向密度" name={["parameter", "horizontalDensity"]}>
        <Slider
          marks={marks}
          min={0.02}
          max={1}
          step={0.01}
          onChange={handleHorizontalDensityChange}
        />
      </Item>

      <Item
        label="纵向密度"
        name={
          bindDensities
            ? ["parameter", "horizontalDensity"]
            : ["parameter", "verticalDensity"]
        }
      >
        <Slider
          marks={marks}
          min={0.02}
          max={1}
          step={0.01}
          disabled={bindDensities}
        />
      </Item>

      <Item
        label="绑定横纵密度"
        name="bindHorizationAndVertical"
        valuePropName="checked"
      >
        <Switch onChange={handleBindDensityChange} />
      </Item>
    </>
  );
};

const DISPLAYMODE_STRING = {
  [EDisplayMode.INTERPOLATION]: "差值",
  [EDisplayMode.TOPOLOGY]: "拓扑生成",
};

const DisplayModeControl: FC<{} & React.HTMLAttributes<HTMLFormElement>> = ({
  ...props
}) => {
  const { displayMode, update } = useConfigStore();

  return (
    <>
      <Form
        {...props}
        onValuesChange={(c) => {
          update(c);
        }}
      >
        <FormItem label="模式" name="displayMode" initialValue={displayMode}>
          <Radio.Group buttonStyle="solid">
            {Object.entries(DISPLAYMODE_STRING).map(([value, label]) => (
              <Radio.Button key={value} value={value}>
                {label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </FormItem>
      </Form>
    </>
  );
};

const RealControlPanel: FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  const { displayMode } = useConfigStore();
  return (
    <Space direction="vertical" className="flex flex-col">
      <Card>
        <DisplayModeControl />
      </Card>
      {displayMode === EDisplayMode.INTERPOLATION && (
        <InterpolationControlPanel />
      )}
      {displayMode === EDisplayMode.TOPOLOGY && <TopologyControlPanel />}
    </Space>
  );
};

const TopologyControlPanel: FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => {
  const handleDownload = useCallback(() => {
    alert("download");
  }, []);
  return (
    <Card {...props}>
      <Button onClick={handleDownload}>下载拓扑模型</Button>
    </Card>
  );
};

const InterpolationControlPanel: FC<Omit<FormProps, "children">> = ({
  ...props
}) => {
  const [form] = useForm<ControlFormValue>();
  const [formValues, setFormValues] = useState<ControlFormValue>();

  const algorithm = useWatch("algorithm", form);
  const showContour = useWatch("showContour", form);

  const { update, config, displayMode } = useConfigStore();

  useDebounce(
    () => {
      if (formValues) {
        update({ config: formValues });
      }
    },
    100,
    [formValues]
  );

  useEffect(() => {
    form.setFieldsValue(config);
    // intentionally ignore the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <Form
        form={form}
        onValuesChange={(e) => {
          form.validateFields().then((values) => setFormValues(values));
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
        {algorithm === EAlgorithm.IRREGULAR_TRIANGLES || (
          <Form.Item label="参数" name="parameter">
            <AlgorithmParameter algorithm={algorithm} />
          </Form.Item>
        )}
        <Item
          label="显示等值线"
          name="showContour"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Item>
        {showContour && (
          <>
            <Item label="等值线数量" name="contourCount" initialValue={10}>
              <Slider min={1} max={20} />
            </Item>
            <Item label="等值线类型" name="smoothContour" initialValue={false}>
              <Radio.Group
                options={[
                  { label: "光滑", value: true },
                  { label: "折线", value: false },
                ]}
              ></Radio.Group>
            </Item>
          </>
        )}
      </Form>
    </Card>
  );
};

export default RealControlPanel;
