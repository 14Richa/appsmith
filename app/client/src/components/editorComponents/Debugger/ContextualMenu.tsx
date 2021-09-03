import React from "react";
import copy from "copy-to-clipboard";
import Menu from "components/ads/Menu";
import styled from "styled-components";
import Text, { FontWeight, TextType } from "components/ads/Text";
import { Message } from "entities/AppsmithConsole";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { Dispatch } from "redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { filterCategories, SEARCH_CATEGORY_ID } from "../GlobalSearch/utils";
import { getAppsmithConfigs } from "configs";
import { createMessage, DEBUGGER_INTERCOM_TEXT } from "constants/messages";
import { useDispatch } from "react-redux";
import { Classes as BPClasses, Position } from "@blueprintjs/core";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import { Colors } from "constants/Colors";
const { intercomAppID } = getAppsmithConfigs();

const getOptions = (type?: string, subType?: string) => {
  const defaultOptions = ["copy", "docs", "google", "intercom"];

  if (subType) {
    switch (subType) {
      case "DATASOURCE_CONFIG_ERROR":
        return ["copy", "google", "intercom"];
      case "PLUGIN_ERROR":
        return ["copy", "google", "intercom"];
      case "CONNECTIVITY_ERROR":
        return ["copy", "docs"];
      case "ACTION_CONFIG_ERROR":
        return ["copy", "docs", "intercom"];
      default:
        return defaultOptions;
    }
  } else {
    switch (type) {
      case PropertyEvaluationErrorType.VALIDATION:
        return ["copy", "docs", "intercom"];
      case PropertyEvaluationErrorType.PARSE:
        return ["copy", "google"];
      case PropertyEvaluationErrorType.LINT:
        return ["copy", "google"];
      default:
        return defaultOptions;
    }
  }
};

type ContextualMenuProps = {
  error: Message;
  children: JSX.Element;
};

const searchAction: Record<string, any> = {
  copy: {
    icon: "duplicate",
    text: "Copy",
    onSelect: (error: Message) => {
      copy(error.message);
    },
  },
  google: {
    icon: "share",
    text: "Ask Google",
    onSelect: (error: Message) => {
      window.open("http://google.com/search?q=" + error.message);
    },
  },
  docs: {
    icon: "book-line",
    text: "Open Documentation",
    onSelect: (error: Message, dispatch: Dispatch) => {
      // Search through the omnibar
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DEBUGGER",
        searchTerm: error.message,
        errorType: PropertyEvaluationErrorType.VALIDATION,
      });
      dispatch(setGlobalSearchQuery(error.message || ""));
      dispatch(
        toggleShowGlobalSearchModal(filterCategories[SEARCH_CATEGORY_ID.INIT]),
      );
    },
  },
  intercom: {
    icon: "chat",
    text: "Get Appsmith Support",
    onSelect: (error: Message) => {
      // Search through the omnibar
      if (intercomAppID && window.Intercom) {
        window.Intercom(
          "showNewMessage",
          createMessage(DEBUGGER_INTERCOM_TEXT, error.message),
        );
      }
    },
  },
};

const IconContainer = styled.span`
  display: flex;
  align-items: center;

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[4]}px;
  }
`;

const MenuItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0px ${(props) => props.theme.spaces[6]}px;
  height: 28px;

  .${Classes.TEXT} {
    color: ${Colors.CODE_GRAY};
  }

  .${Classes.ICON} {
    path {
      fill: ${Colors.CODE_GRAY};
    }
  }

  &:hover {
    text-decoration: none;
    cursor: pointer;
    background-color: ${(props) => props.theme.colors.menuItem.hoverBg};

    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.menuItem.hoverText};
    }
    .${Classes.ICON} {
      path {
        fill: ${(props) => props.theme.colors.menuItem.hoverIcon};
      }
    }
  }
`;

export default function ContextualMenu(props: ContextualMenuProps) {
  const options = getOptions(props.error.type, props.error.subType);
  const dispatch = useDispatch();

  return (
    <Menu
      menuItemWrapperWidth={"175px"}
      modifiers={{
        offset: {
          offset: "25px, 5px",
        },
      }}
      position={Position.RIGHT}
      target={props.children}
    >
      {options.map((e) => {
        const menuProps = searchAction[e];
        const onSelect = () => {
          menuProps.onSelect(props.error, dispatch);
        };

        return (
          <MenuItem
            className={BPClasses.POPOVER_DISMISS}
            key={e}
            onClick={onSelect}
          >
            <IconContainer>
              <Icon name={menuProps.icon} size={IconSize.XS} />
              <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                {menuProps.text}
              </Text>
            </IconContainer>
          </MenuItem>
        );
      })}
    </Menu>
  );
}
