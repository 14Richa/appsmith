import React, { useEffect } from "react";
import styled, { AnyStyledComponent } from "styled-components";
import { Colors } from "constants/Colors";
import {
  ReactTableColumnProps,
  ReactTableFilter,
  Operator,
  OperatorTypes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { DropdownOption } from "components/designSystems/appsmith/TableComponent/TableFilters";
import Button from "components/editorComponents/Button";
import CascadeFields from "components/designSystems/appsmith/TableComponent/CascadeFields";
import {
  createMessage,
  TABLE_FILTER_COLUMN_TYPE_CALLOUT,
} from "constants/messages";
import { ControlIcons } from "icons/ControlIcons";

const StyledPlusCircleIcon = styled(
  ControlIcons.ADD_CIRCLE_CONTROL as AnyStyledComponent,
)`
  padding: 0;
  position: relative;
  cursor: pointer;
  svg {
    circle {
      fill: none !important;
      stroke: ${Colors.GREEN};
    }
  }
`;

const TableFilterOuterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${Colors.WHITE};
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);
`;

const TableFilerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2px 16px 14px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  background: ${Colors.WHITE};
  margin-top: 14px;
  &&& button:hover {
    background: transparent;
  }
`;

const ButtonActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  &&& button {
    margin-left: 14px;
  }
`;

// margin-left is same as move block width in TableFilterPane.tsx
const ColumnTypeBindingMessage = styled.div`
  height: 41px;
  line-height: 41px;
  background: ${Colors.ATHENS_GRAY_DARKER};
  box-sizing: border-box;
  font-size: 12px;
  color: ${Colors.SLATE_GRAY};
  letter-spacing: 0.04em;
  font-weight: 500;
  padding: 0 16px;
  margin-left: 83px;
  min-width: 350px;
  text-align: right;
`;

interface TableFilterProps {
  columns: ReactTableColumnProps[];
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  hideFilterPane: (widgetId: string) => void;
  widgetId: string;
}

const DEFAULT_FILTER = {
  column: "",
  operator: OperatorTypes.OR,
  value: "",
  condition: "",
};

function TableFilterPaneContent(props: TableFilterProps) {
  const [filters, updateFilters] = React.useState(
    new Array<ReactTableFilter>(),
  );

  useEffect(() => {
    const filters: ReactTableFilter[] = props.filters ? [...props.filters] : [];
    if (filters.length === 0) {
      filters.push({ ...DEFAULT_FILTER });
    }
    updateFilters(filters);
  }, [props.filters]);

  const addFilter = () => {
    const updatedFilters = filters ? [...filters] : [];
    let operator: Operator = OperatorTypes.OR;
    if (updatedFilters.length >= 2) {
      operator = updatedFilters[1].operator;
    }
    updatedFilters.push({ ...DEFAULT_FILTER, operator });
    updateFilters(updatedFilters);
  };

  const applyFilter = () => {
    props.applyFilter(filters);
  };

  const hideFilter = () => {
    props.hideFilterPane(props.widgetId);
  };

  const columns: DropdownOption[] = props.columns
    .map((column: ReactTableColumnProps) => {
      const type = column.metaProperties?.type || "text";
      return {
        label: column.Header,
        value: column.accessor,
        type: type,
      };
    })
    .filter((column: { label: string; value: string; type: string }) => {
      return !["video", "button", "image", "iconButton"].includes(
        column.type as string,
      );
    });
  const hasAnyFilters = !!(
    filters.length >= 1 &&
    filters[0].column &&
    filters[0].condition
  );
  return (
    <TableFilterOuterWrapper
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <ColumnTypeBindingMessage>
        {createMessage(TABLE_FILTER_COLUMN_TYPE_CALLOUT)}
      </ColumnTypeBindingMessage>
      <TableFilerWrapper onClick={(e) => e.stopPropagation()}>
        {filters.map((filter: ReactTableFilter, index: number) => {
          return (
            <CascadeFields
              applyFilter={(filter: ReactTableFilter, index: number) => {
                // here updated filters store in state, not in redux
                const updatedFilters = filters ? [...filters] : [];
                updatedFilters[index] = filter;
                updateFilters(updatedFilters);
              }}
              column={filter.column}
              columns={columns}
              condition={filter.condition}
              hasAnyFilters={hasAnyFilters}
              index={index}
              key={index}
              operator={
                filters.length >= 2 ? filters[1].operator : filter.operator
              }
              removeFilter={(index: number) => {
                if (index === 1 && filters.length > 2) {
                  filters[2].operator = filters[1].operator;
                }
                const newFilters = [
                  ...filters.slice(0, index),
                  ...filters.slice(index + 1),
                ];
                if (newFilters.length === 0) {
                  newFilters.push({ ...DEFAULT_FILTER });
                }
                // removed filter directly update redux
                // with redux update, useEffect will update local state too
                props.applyFilter(newFilters);
              }}
              value={filter.value}
            />
          );
        })}
        {hasAnyFilters ? (
          <ButtonWrapper>
            <Button
              className="t--add-filter-btn"
              icon={<StyledPlusCircleIcon height={16} width={16} />}
              intent="primary"
              onClick={addFilter}
              size="small"
              text="Add Filter"
            />
            <ButtonActionsWrapper>
              <Button
                className="t--close-filter-btn"
                intent="primary"
                onClick={hideFilter}
                outline
                text="CLOSE"
              />
              <Button
                className="t--apply-filter-btn"
                filled
                intent="primary"
                onClick={applyFilter}
                text="APPLY"
              />
            </ButtonActionsWrapper>
          </ButtonWrapper>
        ) : null}
      </TableFilerWrapper>
    </TableFilterOuterWrapper>
  );
}

export default TableFilterPaneContent;
