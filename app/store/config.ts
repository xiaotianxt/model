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
      horizontalDensity: 20,
      verticalDensity: 20,
    },
    showGrid: false,
    showContour: false,
    smoothContour: false,
  },
  update: (state) => {
    set(old => {
      return {
        ...old,
        ...state,
      }
    });
  }
}))