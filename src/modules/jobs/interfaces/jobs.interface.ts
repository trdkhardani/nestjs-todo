export interface GetJobsLogInterface {
  userId: string;
  page?: number;
  limit: number;
  useCursorPagination: boolean;
  cursor?: {
    createdAt: Date;
    _id: string;
  };
}
