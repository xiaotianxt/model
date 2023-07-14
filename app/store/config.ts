import { create } from "zustand";
import { ControlFormValue } from "../playground/ControlPanel";
import { EAlgorithm } from "../types/enum";

export interface ConfigValue {
  config: ControlFormValue;
  update: (state: Partial<ConfigValue>) => void;
}

export const useConfigStore = create<ConfigValue>((set, get) => ({
  config: {
    algorithm: EAlgorithm.WEIGHTED_AVERAGE_BY_ORIENTATION,
    parameter: {
      horizontalDensity: 0.5,
      verticalDensity: 0.5,
    },
    showContour: false,
    smoothContour: false,
  },
  update: (state) => {
    set((old) => {
      return {
        ...old,
        config: {
          ...old.config,
          ...state.config,
          parameter: {
            ...old.config.parameter,
            ...state.config?.parameter,
          },
        },
      };
    });
  },
}));