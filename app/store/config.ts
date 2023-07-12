import { create } from "zustand";
import { ControlFormValue } from "../playground/ControlPanel";
import { EAlgorithm, EDisplayMode } from "../types/enum";

export interface ConfigValue {
  config: ControlFormValue;
  displayMode: EDisplayMode;
  update: (state: Partial<ConfigValue>) => void;
  toggleDisplayMode: () => void;
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
  displayMode: EDisplayMode.INTERPOLATION,
  toggleDisplayMode: () => {
    set((old) => ({
      ...old,
      displayMode:
        old.displayMode === EDisplayMode.INTERPOLATION
          ? EDisplayMode.TOPOLOGY
          : EDisplayMode.INTERPOLATION,
    }));
  },
  update: (state) => {
    set((old) => {
      return {
        ...old,
        ...state,
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
