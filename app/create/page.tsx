import { PantavionPage } from "../pantavion-clean-ui";

export default function CreatePage() {
  return (
    <PantavionPage
      current="create"
      title="CREATE • PROJECTS & MAKING"
      subtitle="All creative and execution projects in one place: personal, family, professional and business creation from idea to structured delivery."
      cards={[
        {
          title: "Personal",
          copy: "A future board for personal tasks, deadlines, reminders and private execution plans.",
        },
        {
          title: "Family / friends",
          copy: "A future board for shared projects, trusted coordination and personal collaboration flows.",
        },
        {
          title: "Work / business",
          copy: "A future board for operational tasks, planning, delivery and collaborative execution.",
        },
      ]}
    />
  );
}
