import { Button, Space } from "antd";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type FilterPanelProps = {
  fields: ReactNode[];
  actions: ReactNode;
  defaultVisibleCount?: number;
};

export function FilterPanel({ fields, actions, defaultVisibleCount = 5 }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleFields = useMemo(() => {
    if (expanded || fields.length <= defaultVisibleCount) {
      return fields;
    }

    return fields.slice(0, defaultVisibleCount);
  }, [defaultVisibleCount, expanded, fields]);

  const hasMore = fields.length > defaultVisibleCount;

  return (
    <div className="filter-panel">
      <div className="filter-panel__fields">
        {visibleFields.map((field, index) => (
          <div key={index} className="filter-panel__field">
            {field}
          </div>
        ))}
      </div>

      <div className="filter-panel__footer">
        <Space wrap className="filter-panel__actions">
          {actions}
        </Space>
        {hasMore ? (
          <Button type="link" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "收起筛选" : "更多筛选"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
