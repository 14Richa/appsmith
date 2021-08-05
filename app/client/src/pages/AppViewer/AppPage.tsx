import React, { useEffect } from "react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { WidgetProps } from "widgets/BaseWidget";

const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;

type AppPageProps = {
  dsl: ContainerWidgetProps<WidgetProps>;
  pageName?: string;
  pageId?: string;
  appName?: string;
  width: number;
};

export function AppPage(props: AppPageProps) {
  useDynamicAppLayout();
  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_LOAD", {
      pageName: props.pageName,
      pageId: props.pageId,
      appName: props.appName,
      mode: "VIEW",
    });
  }, [props.pageId, props.pageName]);
  return (
    <PageView width={props.width}>
      {props.dsl.widgetId && WidgetFactory.createWidget(props.dsl)}
    </PageView>
  );
}

export default AppPage;
