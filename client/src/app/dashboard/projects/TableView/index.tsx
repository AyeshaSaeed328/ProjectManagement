import { Task } from "@/state/api";
import { DataTable } from "@/components/data-table";
import { taskColumns } from "@/components/data-table";

type Props = {
  tasks: Task[];
};

const TableView = ({ tasks }: Props) => {
  return (
    <div className="px-4 pb-8 xl:px-6">
      <DataTable columns={taskColumns} data={tasks} />
    </div>
  );
};

export default TableView;
