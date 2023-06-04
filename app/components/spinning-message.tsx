/** @jsxImportSource @emotion/react */
import React, { FC } from "react";
import { Spin } from "antd";
import { css } from "@emotion/react";

const SpinningMessage: FC<{ computing: boolean }> = ({ computing }) => {
  return (
    <div
      css={css`
        position: fixed;
        top: ${computing ? "2.5em" : "-100px"};
        display: ${computing ? "block" : "none"};
        transition: top 0.5s ease-out;
        /* additional styles */
      `}
      className="self-center flex-1 bg-white rounded-lg"
    >
      {computing && (
        <Spin spinning={true} size={"large"}>
          <div className="w-30 aspect-square"></div>
        </Spin>
      )}
    </div>
  );
};

export default SpinningMessage;
