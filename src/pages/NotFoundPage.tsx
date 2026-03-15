import { Button, Result } from "antd";
import { Link } from "react-router-dom";

type NotFoundPageProps = {
  compact?: boolean;
};

export function NotFoundPage({ compact = false }: NotFoundPageProps) {
  return (
    <div className={compact ? "not-found not-found--compact" : "not-found"}>
      <Result
        status="404"
        title="页面不存在"
        subTitle="当前路由没有对应的角色、系统或模块。"
        extra={
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        }
      />
    </div>
  );
}
