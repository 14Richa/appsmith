import React, { useEffect, useRef, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { Highlight as AlgoliaHighlight } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import styled, { css } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Highlight from "./Highlight";
import ActionLink, { StyledActionLink } from "./ActionLink";
import scrollIntoView from "scroll-into-view-if-needed";
import {
  getItemType,
  getItemTitle,
  SEARCH_ITEM_TYPES,
  SearchItem,
} from "./utils";
import SearchContext from "./GlobalSearchContext";
import {
  getWidgetIcon,
  getPluginIcon,
  homePageIcon,
  pageIcon,
  apiIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { HelpIcons } from "icons/HelpIcons";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { AppState } from "reducers";
import { keyBy, noop } from "lodash";
import { getPageList } from "selectors/editorSelectors";
import { PluginType } from "entities/Action";
import { APPLY_SEARCH_CATEGORY, createMessage } from "constants/messages";

const DocumentIcon = HelpIcons.DOCUMENT;

const overflowCSS = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const SearchItemContainer = styled.div<{
  isActiveItem: boolean;
  itemType: SEARCH_ITEM_TYPES;
}>`
  cursor: ${(props) =>
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? "pointer"
      : "default"};
  display: flex;
  align-items: center;
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[4]}px`};
  color: ${(props) =>
    props.isActiveItem
      ? "white"
      : props.theme.colors.globalSearch.searchItemText};
  margin: ${(props) => props.theme.spaces[1]}px 0;
  background-color: ${(props) =>
    props.isActiveItem &&
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? `${props.theme.colors.globalSearch.activeSearchItemBackground} !important`
      : "unset"};

  .text {
    max-width: 300px;
    color: ${(props) =>
      props.isActiveItem
        ? "white"
        : props.theme.colors.globalSearch.searchItemText};
    font-size: ${(props) => props.theme.fontSizes[3]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    margin-right: ${(props) => `${props.theme.spaces[1]}px`};
    ${overflowCSS}
  }

  .subtext {
    color: ${(props) =>
      props.isActiveItem
        ? "white"
        : props.theme.colors.globalSearch.searchItemSubText};
    font-size: ${(props) => props.theme.fontSizes[2]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    margin-right: ${(props) => `${props.theme.spaces[2]}px`};
    display: inline;
    max-width: 300px;
    ${overflowCSS}
  }

  &:hover {
    background-color: ${(props) =>
      props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
      props.itemType !== SEARCH_ITEM_TYPES.placeholder
        ? "#E8E8E8"
        : "unset"};
    color: ${(props) => (props.isActiveItem ? "white" : "#484848")};
    .category-title {
      color: ${(props) => (props.isActiveItem ? "white" : "#484848")};
    }
    .category-desc {
      color: ${(props) => (props.isActiveItem ? "white" : "#484848")};
    }
    ${StyledActionLink} {
      visibility: visible;
    }
    .icon-wrapper {
      svg {
        path: {
          fill: #484848 !important;
        }
      }
    }
    .subtext,
    .text {
      color: ${(props) => (props.isActiveItem ? "white" : "#484848")};
    }
  }

  ${(props) => getTypographyByKey(props, "p3")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p3")};
  }
`;

const ItemTitle = styled.div`
  margin-left: ${(props) => props.theme.spaces[5]}px;
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
  ${(props) => getTypographyByKey(props, "p3")};
  font-w [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p3")};
  }
`;

const StyledDocumentIcon = styled(DocumentIcon)<{ isActiveItem: boolean }>`
  && svg {
    width: 14px;
    height: 14px;
    path {
      fill: ${(props) =>
        props.isActiveItem ? "transparent" : "#6a86ce !important"};
    }
  }
  display: flex;
`;

const TextWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

function DocumentationItem(props: { item: SearchItem; isActiveItem: boolean }) {
  return (
    <>
      <StyledDocumentIcon isActiveItem={props.isActiveItem} />
      <ItemTitle>
        <span>
          <AlgoliaHighlight attribute="title" hit={props.item} />
        </span>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

const WidgetIconWrapper = styled.span<{ isActiveItem: boolean }>`
  display: flex;
  svg {
    height: 14px;
    path {
      fill: ${(props) => (props.isActiveItem ? "white" : "#716E6E !important")};
    }
  }
`;

const usePageName = (pageId: string) => {
  const pages = useSelector(getPageList);
  const page = pages.find((page) => page.pageId === pageId);
  return page?.pageName;
};

function WidgetItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const { type } = item || {};
  const title = getItemTitle(item);
  const pageName = usePageName(item.pageId);
  const subText = `${pageName}`;

  return (
    <>
      <WidgetIconWrapper
        className="icon-wrapper"
        isActiveItem={props.isActiveItem}
      >
        {getWidgetIcon(type)}
      </WidgetIconWrapper>
      <ItemTitle>
        <TextWrapper>
          <Highlight className="text" match={query} text={title} />
          <Highlight className="subtext" match={query} text={subText} />
        </TextWrapper>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

const ActionIconWrapper = styled.div`
  & > div {
    display: flex;
    align-items: center;
  }
`;

function ActionItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const { config } = item || {};
  const { pluginType } = config;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon =
    pluginType === PluginType.API
      ? apiIcon
      : getActionConfig(pluginType)?.getIcon(
          item.config,
          pluginGroups[item.config.datasource.pluginId],
        );

  const title = getItemTitle(item);
  const pageName = usePageName(config.pageId);
  const subText = `${pageName}`;

  return (
    <>
      <ActionIconWrapper>{icon}</ActionIconWrapper>
      <ItemTitle>
        <TextWrapper>
          <Highlight className="text" match={query} text={title} />
          <Highlight className="subtext" match={query} text={subText} />
        </TextWrapper>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

function DatasourceItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = getPluginIcon(pluginGroups[item.pluginId]);
  const title = getItemTitle(item);
  return (
    <>
      {icon}
      <ItemTitle>
        <Highlight className="text" match={query} text={title} />
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

function PageItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const title = getItemTitle(item);
  const icon = item.isDefault ? homePageIcon : pageIcon;

  return (
    <>
      {icon}
      <ItemTitle>
        <Highlight className="text" match={query} text={title} />
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

const StyledSectionTitleContainer = styled.div`
  display: flex;
  align-items: center;
  & .section-title__icon {
    width: 14px;
    height: 14px;
    margin-right: ${(props) => props.theme.spaces[5]}px;
    margin-left: ${(props) => props.theme.spaces[3]}px;
  }
  & .section-title__text {
    color: ${(props) => props.theme.colors.globalSearch.sectionTitle};
    font-size: 12px;
    font-weight: 600;
  }
  margin-left: -${(props) => props.theme.spaces[3]}px;
`;

function SectionTitle({ item }: { item: SearchItem }) {
  return (
    <StyledSectionTitleContainer>
      <img className="section-title__icon" src={item.icon} />
      <span className="section-title__text">{item.title}</span>
    </StyledSectionTitleContainer>
  );
}

function Placeholder({ item }: { item: SearchItem }) {
  return <div>{item.title}</div>;
}

const CategoryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-item: center;
  justify-content: space-between;
  padding: 12px 10px;
  width: 100%;
`;

const CategoryListItem = styled.div<{ isActiveItem: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  .content {
    display: flex;
    flex-direction: column;
    .category-title {
      ${(props) => getTypographyByKey(props, "h5")}
      color: ${(props) =>
        props.isActiveItem
          ? props.theme.colors.globalSearch.searchItemAltText
          : props.theme.colors.globalSearch.searchItemText};
    }
    .category-desc {
      ${(props) => getTypographyByKey(props, "p3")}
      color: ${(props) =>
        props.isActiveItem
          ? props.theme.colors.globalSearch.searchItemAltText
          : props.theme.colors.globalSearch.searchItemSubText};
    }
  }
  .action-msg {
    color: ${(props) => props.theme.colors.globalSearch.searchItemAltText};
    ${(props) => getTypographyByKey(props, "p3")}
    flex-shrink: 0;
  }
`;

function CategoryItem({
  isActiveItem,
  item,
}: {
  item: SearchItem;
  isActiveItem: boolean;
}) {
  return (
    <CategoryContainer>
      <CategoryListItem isActiveItem={isActiveItem}>
        <div className="content">
          <span className="category-title">{item.title}</span>
          <span className="category-desc">{item.desc}</span>
        </div>
        {isActiveItem && (
          <div className="action-msg">
            {createMessage(APPLY_SEARCH_CATEGORY)}
          </div>
        )}
      </CategoryListItem>
    </CategoryContainer>
  );
}

function SnippetItem({
  item: {
    body: { title },
  },
}: any) {
  return <span>{title}</span>;
}

const SearchItemByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationItem,
  [SEARCH_ITEM_TYPES.widget]: WidgetItem,
  [SEARCH_ITEM_TYPES.action]: ActionItem,
  [SEARCH_ITEM_TYPES.datasource]: DatasourceItem,
  [SEARCH_ITEM_TYPES.page]: PageItem,
  [SEARCH_ITEM_TYPES.sectionTitle]: SectionTitle,
  [SEARCH_ITEM_TYPES.placeholder]: Placeholder,
  [SEARCH_ITEM_TYPES.category]: CategoryItem,
  [SEARCH_ITEM_TYPES.snippet]: SnippetItem,
};

type ItemProps = {
  item: IHit | SearchItem;
  index: number;
  query: string;
};

function SearchItemComponent(props: ItemProps) {
  const { index, item, query } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const searchContext = useContext(SearchContext);
  const activeItemIndex = searchContext?.activeItemIndex;
  const setActiveItemIndex = searchContext?.setActiveItemIndex || noop;

  const isActiveItem = activeItemIndex === index;

  useEffect(() => {
    if (isActiveItem && itemRef.current) {
      scrollIntoView(itemRef.current, { scrollMode: "if-needed" });
    }
  }, [isActiveItem]);

  const itemType = getItemType(item);
  const Item = SearchItemByType[itemType];

  return (
    <SearchItemContainer
      className="t--docHit"
      isActiveItem={isActiveItem}
      itemType={itemType}
      onClick={(e: React.MouseEvent) => {
        if (
          itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
          itemType !== SEARCH_ITEM_TYPES.placeholder
        ) {
          setActiveItemIndex(index);
          searchContext?.handleItemLinkClick(e, item, "SEARCH_ITEM");
        }
      }}
      ref={itemRef}
    >
      <Item isActiveItem={isActiveItem} item={item} query={query} />
    </SearchItemContainer>
  );
}

const SearchResultsContainer = styled.div`
  flex: 1;
  background: white;
  position: relative;
  .container {
    overflow: auto;
    height: 100%;
    width: 100%;
    padding-bottom: 50px;
  }
`;

function SearchResults({
  query,
  searchResults,
}: {
  searchResults: SearchItem[];
  query: string;
  showFilter: boolean;
  refinements: any;
}) {
  return (
    <SearchResultsContainer>
      <div className="container">
        {searchResults.map((item: SearchItem, index: number) => (
          <SearchItemComponent
            index={index}
            item={item}
            key={index}
            query={query}
          />
        ))}
      </div>
    </SearchResultsContainer>
  );
}

export default SearchResults;
