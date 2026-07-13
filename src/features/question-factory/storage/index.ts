export { FACTORY_COMPARTMENTS, isFactoryCompartment } from "./compartments";
export type { FactoryCompartment } from "./compartments";
export type {
  CreateFailureReason,
  CreateResult,
  FactoryRepository,
  MoveFailureReason,
  MoveResult,
  ReconciliationAction,
  ReconciliationEntry,
  ReconciliationReport,
  UpdateFailureReason,
  UpdateOptions,
  UpdateResult,
} from "./factory-repository";
export { FsFactoryRepository } from "./fs-factory-repository";
export { REJECTION_GATES, compartmentForState } from "./state-compartment-mapping";
export type { RejectionGate } from "./state-compartment-mapping";
