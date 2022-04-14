import { SyncHook, SyncWaterfallHook } from 'tapable';
import type { Resolve } from '@player-ui/view';
import { ViewInstance } from '@player-ui/view';
import type { Logger } from '@player-ui/logger';
import type { FlowInstance, FlowController } from '@player-ui/flow';
import type { View, NavigationFlowViewState } from '@player-ui/types';
import { resolveDataRefsInString } from '@player-ui/string-resolver';
import { Registry } from '@player-ui/partial-match-registry';
import queueMicrotask from 'queue-microtask';
import type { DataController } from '../data';
import { AssetTransformCorePlugin } from './asset-transform';
import type { TransformRegistry } from './types';
import type { BindingInstance } from '..';

export interface ViewControllerOptions {
  /** Where to get data from */
  model: DataController;

  /** Where to log data */
  logger?: Logger;

  /** A flow-controller instance to listen for view changes */
  flowController: FlowController;
}

/** A controller to manage updating/switching views */
export class ViewController {
  public readonly hooks = {
    /** Do any processing before the `View` instance is created */
    resolveView: new SyncWaterfallHook<View, string, NavigationFlowViewState>([
      'view',
      'viewRef',
      'viewState',
    ]),

    // The hook right before the View starts resolving. Attach anything custom here
    view: new SyncHook<ViewInstance>(['view']),
  };

  private readonly viewMap: Record<string, View>;
  private readonly viewOptions: Resolve.ResolverOptions & ViewControllerOptions;
  private pendingUpdate?: {
    /** pending data binding changes */
    changedBindings?: Set<BindingInstance>;
  };

  public currentView?: ViewInstance;
  public transformRegistry: TransformRegistry = new Registry();
  public optimizeUpdates = true;

  constructor(
    initialViews: View[],
    options: Resolve.ResolverOptions & ViewControllerOptions
  ) {
    this.viewOptions = options;
    this.viewMap = initialViews.reduce<Record<string, View>>(
      (viewMap, view) => ({
        ...viewMap,
        [view.id]: view,
      }),
      {}
    );

    new AssetTransformCorePlugin(this.transformRegistry).apply(this);

    options.flowController.hooks.flow.tap(
      'viewController',
      (flow: FlowInstance) => {
        flow.hooks.transition.tap('viewController', (_oldState, newState) => {
          if (newState.value.state_type === 'VIEW') {
            this.onView(newState.value);
          } else {
            this.currentView = undefined;
          }
        });
      }
    );

    options.model.hooks.onUpdate.tap('viewController', (updates) => {
      if (this.currentView) {
        if (this.optimizeUpdates) {
          this.queueUpdate(new Set(updates.map((t) => t.binding)));
        } else {
          this.currentView.update();
        }
      }
    });
  }

  private queueUpdate(bindings: Set<BindingInstance>) {
    if (this.pendingUpdate?.changedBindings) {
      this.pendingUpdate.changedBindings = new Set([
        ...this.pendingUpdate.changedBindings,
        ...bindings,
      ]);
    } else {
      this.pendingUpdate = { changedBindings: bindings };
      queueMicrotask(() => {
        const updates = this.pendingUpdate?.changedBindings;
        this.pendingUpdate = undefined;
        this.currentView?.update(updates);
      });
    }
  }

  private getViewForRef(viewRef: string): View | undefined {
    // First look for a 1:1 viewRef -> id mapping (this is most common)
    if (this.viewMap[viewRef]) {
      return this.viewMap[viewRef];
    }

    // The view ids saved may also contain model refs, resolve those and try again
    const matchingViewId = Object.keys(this.viewMap).find(
      (possibleViewIdMatch) =>
        viewRef ===
        resolveDataRefsInString(possibleViewIdMatch, {
          model: this.viewOptions.model,
          evaluate: this.viewOptions.evaluator.evaluate,
        })
    );

    if (matchingViewId && this.viewMap[matchingViewId]) {
      return this.viewMap[matchingViewId];
    }
  }

  public onView(state: NavigationFlowViewState) {
    const viewId = state.ref;

    const source = this.hooks.resolveView.call(
      this.getViewForRef(viewId),
      viewId,
      state
    );

    if (!source) {
      throw new Error(`No view with id ${viewId}`);
    }

    const view = new ViewInstance(source, this.viewOptions);
    this.currentView = view;

    // Give people a chance to attach their
    // own listeners to the view before we resolve it
    this.hooks.view.call(view);
    view.update();
  }
}
