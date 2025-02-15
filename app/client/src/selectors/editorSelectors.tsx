import { createSelector } from "reselect";

import { AppState } from "reducers";
import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import {
  WIDGET_STATIC_PROPS,
  WidgetCardProps,
  WidgetProps,
} from "widgets/BaseWidget";
import { WidgetSidebarReduxState } from "reducers/uiReducers/widgetSidebarReducer";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

import { OccupiedSpace } from "constants/editorConstants";
import { getDataTree, getLoadingEntities } from "selectors/dataTreeSelectors";
import _ from "lodash";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { getActions } from "selectors/entitiesSelector";

import { getCanvasWidgets } from "./entitiesSelector";
import {
  MAIN_CONTAINER_WIDGET_ID,
  WidgetTypes,
} from "../constants/WidgetConstants";

const getWidgetConfigs = (state: AppState) => state.entities.widgetConfig;
const getWidgetSideBar = (state: AppState) => state.ui.widgetSidebar;
const getPageListState = (state: AppState) => state.entities.pageList;

export const getProviderCategories = (state: AppState) =>
  state.ui.providers.providerCategories;

const getWidgets = (state: AppState): CanvasWidgetsReduxState =>
  state.entities.canvasWidgets;

export const getIsEditorInitialized = (state: AppState) =>
  state.ui.editor.initialized;

export const getIsEditorLoading = (state: AppState) =>
  state.ui.editor.loadingStates.loading;

export const getIsFetchingPage = (state: AppState) =>
  state.ui.editor.loadingStates.isPageSwitching;

export const getLoadingError = (state: AppState) =>
  state.ui.editor.loadingStates.loadingError;

export const getIsPageSaving = (state: AppState) => {
  let areApisSaving = false;

  const savingApis = state.ui.apiPane.isSaving;

  Object.keys(savingApis).forEach((apiId) => {
    areApisSaving = savingApis[apiId] || areApisSaving;
  });

  return state.ui.editor.loadingStates.saving || areApisSaving;
};

export const snipingModeSelector = (state: AppState) =>
  state.ui.editor?.isSnipingMode;

export const getPageSavingError = (state: AppState) => {
  return state.ui.editor.loadingStates.savingError;
};

export const getLayoutOnLoadActions = (state: AppState) =>
  state.ui.editor.pageActions || [];

export const getIsPublishingApplication = (state: AppState) =>
  state.ui.editor.loadingStates.publishing;

export const getPublishingError = (state: AppState) =>
  state.ui.editor.loadingStates.publishingError;

export const getCurrentLayoutId = (state: AppState) =>
  state.ui.editor.currentLayoutId;

export const getPageList = (state: AppState) => state.entities.pageList.pages;

export const getCurrentPageId = (state: AppState) =>
  state.entities.pageList.currentPageId;

export const getCurrentApplicationId = (state: AppState) =>
  state.entities.pageList.applicationId;

export const getViewModePageList = createSelector(
  getPageList,
  getCurrentPageId,
  (pageList: PageListReduxState["pages"], currentPageId?: string) => {
    if (currentPageId) {
      const currentPage = pageList.find(
        (page) => page.pageId === currentPageId,
      );
      if (!!currentPage?.isHidden) {
        return [currentPage];
      }

      const visiblePages = pageList.filter((page) => !page.isHidden);
      return visiblePages;
    }

    return [];
  },
);

export const getCurrentApplicationLayout = (state: AppState) =>
  state.ui.applications.currentApplication?.appLayout;

export const getCurrentPageName = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.find((page) => page.pageId === pageList.currentPageId)
      ?.pageName,
);

export const getWidgetCards = createSelector(
  getWidgetSideBar,
  getWidgetConfigs,
  (
    widgetCards: WidgetSidebarReduxState,
    widgetConfigs: WidgetConfigReducerState,
  ) => {
    const cards = widgetCards.cards;
    return cards
      .map((widget: WidgetCardProps) => {
        const {
          columns,
          detachFromLayout = false,
          rows,
        }: any = widgetConfigs.config[widget.type];
        return { ...widget, rows, columns, detachFromLayout };
      })
      .sort(
        (
          { widgetCardName: widgetACardName }: WidgetCardProps,
          { widgetCardName: widgetBCardName }: WidgetCardProps,
        ) => widgetACardName.localeCompare(widgetBCardName),
      );
  },
);

const getMainContainer = (
  canvasWidgets: CanvasWidgetsReduxState,
  evaluatedDataTree: DataTree,
) => {
  const canvasWidget = canvasWidgets[MAIN_CONTAINER_WIDGET_ID];
  const evaluatedWidget = _.find(evaluatedDataTree, {
    widgetId: MAIN_CONTAINER_WIDGET_ID,
  }) as DataTreeWidget;
  return createCanvasWidget(canvasWidget, evaluatedWidget);
};

export const getCanvasWidgetDsl = createSelector(
  getCanvasWidgets,
  getDataTree,
  getLoadingEntities,
  (
    canvasWidgets: CanvasWidgetsReduxState,
    evaluatedDataTree,
    loadingEntities,
  ): ContainerWidgetProps<WidgetProps> => {
    const widgets: Record<string, DataTreeWidget> = {
      [MAIN_CONTAINER_WIDGET_ID]: getMainContainer(
        canvasWidgets,
        evaluatedDataTree,
      ),
    };
    Object.keys(canvasWidgets)
      .filter((each) => each !== MAIN_CONTAINER_WIDGET_ID)
      .forEach((widgetKey) => {
        const canvasWidget = canvasWidgets[widgetKey];
        const evaluatedWidget = _.find(evaluatedDataTree, {
          widgetId: widgetKey,
        }) as DataTreeWidget;
        if (evaluatedWidget) {
          widgets[widgetKey] = createCanvasWidget(
            canvasWidget,
            evaluatedWidget,
          );
        } else {
          widgets[widgetKey] = createLoadingWidget(canvasWidget);
        }
        widgets[widgetKey].isLoading = loadingEntities.has(
          canvasWidget.widgetName,
        );
      });

    return CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets: widgets,
    });
  },
);

const getOccupiedSpacesForContainer = (
  containerWidgetId: string,
  widgets: FlattenedWidgetProps[],
): OccupiedSpace[] => {
  return widgets.map((widget) => {
    const occupiedSpace: OccupiedSpace = {
      id: widget.widgetId,
      parentId: containerWidgetId,
      left: widget.leftColumn,
      top: widget.topRow,
      bottom: widget.bottomRow,
      right: widget.rightColumn,
    };
    return occupiedSpace;
  });
};

export const getOccupiedSpaces = createSelector(
  getWidgets,
  (
    widgets: CanvasWidgetsReduxState,
  ): { [containerWidgetId: string]: OccupiedSpace[] } | undefined => {
    const occupiedSpaces: {
      [containerWidgetId: string]: OccupiedSpace[];
    } = {};
    // Get all widgets with type "CONTAINER_WIDGET" and has children
    const containerWidgets: FlattenedWidgetProps[] = Object.values(
      widgets,
    ).filter((widget) => widget.children && widget.children.length > 0);

    // If we have any container widgets
    if (containerWidgets) {
      containerWidgets.forEach((containerWidget: FlattenedWidgetProps) => {
        const containerWidgetId = containerWidget.widgetId;
        // Get child widgets for the container
        const childWidgets = Object.keys(widgets).filter(
          (widgetId) =>
            containerWidget.children &&
            containerWidget.children.indexOf(widgetId) > -1 &&
            !widgets[widgetId].detachFromLayout,
        );
        // Get the occupied spaces in this container
        // Assign it to the containerWidgetId key in occupiedSpaces
        occupiedSpaces[containerWidgetId] = getOccupiedSpacesForContainer(
          containerWidgetId,
          childWidgets.map((widgetId) => widgets[widgetId]),
        );
      });
    }
    // Return undefined if there are no occupiedSpaces.
    return Object.keys(occupiedSpaces).length > 0 ? occupiedSpaces : undefined;
  },
);

// same as getOccupiedSpaces but gets only the container specific ocupied Spaces
export function getOccupiedSpacesSelectorForContainer(
  containerId: string | undefined,
) {
  return createSelector(getWidgets, (widgets: CanvasWidgetsReduxState):
    | OccupiedSpace[]
    | undefined => {
    if (containerId === null || containerId === undefined) return undefined;

    const containerWidget: FlattenedWidgetProps = widgets[containerId];

    if (!containerWidget || !containerWidget.children) return undefined;

    // Get child widgets for the container
    const childWidgets = Object.keys(widgets).filter(
      (widgetId) =>
        containerWidget.children &&
        containerWidget.children.indexOf(widgetId) > -1 &&
        !widgets[widgetId].detachFromLayout,
    );

    const occupiedSpaces = getOccupiedSpacesForContainer(
      containerId,
      childWidgets.map((widgetId) => widgets[widgetId]),
    );
    return occupiedSpaces;
  });
}

export const getActionById = createSelector(
  [getActions, (state: any, props: any) => props.match.params.apiId],
  (actions, id) => {
    const action = actions.find((action) => action.config.id === id);
    if (action) {
      return action.config;
    } else {
      return undefined;
    }
  },
);

export const getActionTabsInitialIndex = (state: AppState) =>
  state.ui.actionTabs.index;

const createCanvasWidget = (
  canvasWidget: FlattenedWidgetProps,
  evaluatedWidget: DataTreeWidget,
) => {
  const widgetStaticProps = _.pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  );
  return {
    ...evaluatedWidget,
    ...widgetStaticProps,
  };
};

const createLoadingWidget = (
  canvasWidget: FlattenedWidgetProps,
): DataTreeWidget => {
  const widgetStaticProps = _.pick(
    canvasWidget,
    Object.keys(WIDGET_STATIC_PROPS),
  ) as WidgetProps;
  return {
    ...widgetStaticProps,
    type: WidgetTypes.SKELETON_WIDGET,
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
    isLoading: true,
  };
};
