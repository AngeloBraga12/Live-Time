import { MultiviewConsole } from "@/components/multiview/multiview-console";
import { SectionWorkspace } from "@/components/ui/section-workspace";

export default function MultiviewPage() {
  return <SectionWorkspace active="/multiview" title="Multiview"><MultiviewConsole/></SectionWorkspace>;
}
