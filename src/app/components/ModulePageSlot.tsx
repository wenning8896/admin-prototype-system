import { createElement } from "react";
import { useParams } from "react-router-dom";
import { isModuleAvailable } from "../../menu/resolver";
import { resolvePageComponent } from "../../registry/pageRegistry";
import { ModulePlaceholderPage } from "../../pages/ModulePlaceholderPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

export function ModulePageSlot() {
  const { role, system, moduleId } = useParams();

  if (!role || !system || !moduleId || !isModuleAvailable(role, system, moduleId)) {
    return <NotFoundPage compact />;
  }

  const PageComponent = resolvePageComponent(role, system, moduleId);

  if (!PageComponent) {
    return (
      <ModulePlaceholderPage
        title={moduleId}
        description="这个模块的页面还没开始做，但路由、菜单和占位流已经接好了。"
      />
    );
  }

  return createElement(PageComponent);
}
