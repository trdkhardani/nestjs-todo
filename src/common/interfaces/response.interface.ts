export interface ResponseInterface<T> {
  success: boolean;
  data: T | null;
  message: string;
}
