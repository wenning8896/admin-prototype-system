import { createElement } from "react";
import { useParams } from "react-router-dom";
import { isModuleAvailable } from "../../menu/resolver";
import { resolvePageDetailComponent } from "../../registry/pageRegistry";
import { NotFoundPage } from "../../pages/NotFoundPage";

export function ModuleDetailSlot() {
  const { role, system, moduleId } = useParams();

  if (!role || !system || !moduleId || !isModuleAvailable(role, system, moduleId)) {
    return <NotFoundPage compact />;
  }

  const PageComponent = resolvePageDetailComponent(role, system, moduleId);

  if (!PageComponent) {
    return <NotFoundPage compact />;
  }

  return createElement(PageComponent);
}
