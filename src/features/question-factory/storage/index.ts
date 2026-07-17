export { FACTORY_COMPARTMENTS, isFactoryCompartment } from "./compartments";
export type { FactoryCompartment } from "./compartments";
export type {
  CreateFailureReason,
  CreateResult,
  FactoryRepository,
  MoveFailureReason,
  MoveResult,
  ReadOnlyFactoryRepository,
  ReconciliationAction,
  ReconciliationEntry,
  ReconciliationReport,
  RecordInspection,
  UpdateFailureReason,
  UpdateOptions,
  UpdateResult,
} from "./factory-repository";
export { FsFactoryRepository } from "./fs-factory-repository";
export type { FsFactoryRepositoryOptions } from "./fs-factory-repository";
export {
  REJECTION_GATES,
  authoritativeCompartmentsForState,
  compartmentForState,
} from "./state-compartment-mapping";
export type { RejectionGate } from "./state-compartment-mapping";
