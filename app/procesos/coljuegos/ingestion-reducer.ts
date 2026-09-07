import type {
  BatchMode,
  IngestionProgress,
  LocalBatch,
  LocalOrderDraft,
} from "@/lib/coljuegos/types";

export interface IngestionState {
  mode: BatchMode;
  demoLoaded: boolean;
  localBatch: LocalBatch | null;
  orderDraft: LocalOrderDraft;
  progress: IngestionProgress;
}

export type IngestionAction =
  | { type: "START_REAL_BATCH"; orderDraft: LocalOrderDraft }
  | { type: "UPDATE_PROGRESS"; progress: IngestionProgress }
  | { type: "COMPLETE_REAL_BATCH"; batch: LocalBatch }
  | {
    type: "UPDATE_ORDER";
    field: "number" | "machineCount" | "modelCode" | "expectedSerialsText";
    value: string;
  }
  | { type: "LOAD_DEMO" };

export const initialIngestionState: IngestionState = {
  mode: "none",
  demoLoaded: false,
  localBatch: null,
  orderDraft: {
    folderName: "",
    number: "",
    machineCount: "",
    modelCode: "",
    expectedSerialsText: "",
    dataSource: "manual",
  },
  progress: {
    status: "idle",
    processed: 0,
    total: 0,
    errorCount: 0,
  },
};

/**
 * El reducer concentra únicamente el estado de ingesta real. Las fases de
 * lectura y agrupación se incorporarán aquí en sus respectivos bloques.
 */
export function ingestionReducer(
  state: IngestionState,
  action: IngestionAction,
): IngestionState {
  switch (action.type) {
    case "START_REAL_BATCH":
      return {
        ...state,
        mode: "real",
        demoLoaded: false,
        localBatch: null,
        orderDraft: action.orderDraft,
        progress: {
          status: "running",
          processed: 0,
          total: 0,
          errorCount: 0,
        },
      };
    case "UPDATE_PROGRESS":
      return { ...state, progress: action.progress };
    case "COMPLETE_REAL_BATCH":
      return { ...state, localBatch: action.batch };
    case "UPDATE_ORDER":
      return {
        ...state,
        orderDraft: { ...state.orderDraft, [action.field]: action.value },
      };
    case "LOAD_DEMO":
      return {
        ...initialIngestionState,
        mode: "demo",
        demoLoaded: true,
      };
    default:
      return state;
  }
}
