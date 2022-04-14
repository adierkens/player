import type { Flow, FlowResult } from '@player-ui/types';
import { Expression } from '@player-ui/types';
import type { DataModelWithParser } from '@player-ui/data';
import { DataModelOptions } from '@player-ui/data';
import type { FlowController } from '@player-ui/flow';
import { NamedState, TransitionFunction } from '@player-ui/flow';
import { ViewInstance } from '@player-ui/view';
import type { BindingParser, BindingLike } from '@player-ui/binding';
import type { SchemaController } from '@player-ui/schema';
import type { ExpressionEvaluator } from '@player-ui/expressions';
import type { Logger } from '@player-ui/logger';
import type { ViewController } from './view';
import type { DataController } from './data';
import type { ValidationController } from './validation';

/** The status for a flow's execution state */
export type PlayerFlowStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'error';

/** Common interface for the state of Player's flow execution */
export interface BaseFlowState<T extends PlayerFlowStatus> {
  /** A unique reference for the life-cycle of a flow */
  ref: symbol;

  /** The status of the given flow */
  status: T;
}

/** The beginning state of Player, before it's seen a flow  */
export type NotStartedState = BaseFlowState<'not-started'>;

export const NOT_STARTED_STATE: NotStartedState = {
  ref: Symbol('not-started'),
  status: 'not-started',
};

/** Shared properties for a flow in any state of execution (in-progress, completed successfully, or errored out) */
export interface PlayerFlowExecutionData {
  /** The currently executing flow */
  flow: Flow;
}

export interface ControllerState {
  /** The manager for data for a flow */
  data: DataController;

  /** The view manager for a flow */
  view: ViewController;

  /** The schema manager for a flow */
  schema: SchemaController;

  /** The validation manager for a flow */
  validation: ValidationController;

  /** The expression evaluator for a flow */
  expression: ExpressionEvaluator;

  /** The manager for parsing and resolving bindings */
  binding: BindingParser;

  /** the manager for the flow state machine */
  flow: FlowController;
}

/** A flow is currently executing */
export type InProgressState = BaseFlowState<'in-progress'> &
  PlayerFlowExecutionData & {
    /** A promise that resolves when the flow is completed */
    flowResult: Promise<FlowResult>;

    /** The underlying state controllers for the current flow */
    controllers: ControllerState;

    /** Allow other platforms to abort the current flow with an error  */
    fail: (error: Error) => void;

    /**
     * The Logger for the current player instance
     */
    logger: Logger;
  };

/** The flow completed properly */
export type CompletedState = BaseFlowState<'completed'> &
  PlayerFlowExecutionData &
  FlowResult & {
    /** The top-level data-model for the flow */
    dataModel: DataModelWithParser;
  };

/** The flow finished but not successfully */
export type ErrorState = BaseFlowState<'error'> & {
  /** The currently executing flow */
  flow: Flow;

  /** The error associated with the failed flow */
  error: Error;
};

/** Any Player state  */
export type PlayerFlowState =
  | NotStartedState
  | InProgressState
  | CompletedState
  | ErrorState;

// Model

export type RawSetType = [BindingLike, any];
export type RawSetTransaction = Record<string, any> | RawSetType[];
