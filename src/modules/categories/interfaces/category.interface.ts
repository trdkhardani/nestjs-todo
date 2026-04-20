export interface CreateCategoryInput {
  userId: string;
  name: string;
}

export interface GetCategoriesInput {
  userId: string;
}

export interface UpdateCategoryInput {
  userId: string;
  categoryId: string;
  name: string;
}

export interface DeleteCategoryInput {
  userId: string;
  categoryId: string;
}
