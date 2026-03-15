import { ClockCircleOutlined } from "@ant-design/icons";
import { Card, Result, Space, Tag, Typography } from "antd";

type ModulePlaceholderPageProps = {
  title: string;
  description: string;
};

export function ModulePlaceholderPage({
  title,
  description,
}: ModulePlaceholderPageProps) {
  return (
    <Card className="page-card">
      <Result
        icon={<ClockCircleOutlined />}
        title={title}
        subTitle={description}
        extra={
          <Space wrap>
            <Tag color="processing">菜单已保留</Tag>
            <Tag color="default">页面待接入</Tag>
          </Space>
        }
      />
      <Typography.Paragraph className="page-card__note">
        这正是原型系统起步时比较推荐的做法: 菜单先稳定，页面逐步补齐，不要因为某个模块还没开工就把导航结构藏掉。
      </Typography.Paragraph>
    </Card>
  );
}
