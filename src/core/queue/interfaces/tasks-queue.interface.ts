export interface JobTasksData {
  userId: string;
  tasks: {
    title: string;
    description?: string;
    categoryId?: string;
  }[];
}
