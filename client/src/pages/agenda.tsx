import Layout from "@/components/layout";
import { Agenda } from "@/components/agenda";

export default function AgendaPage() {
  return (
    <Layout hideSectionHeader={true}>
      <div className="w-full px-4 py-4">
        <Agenda />
      </div>
    </Layout>
  );
}