export type EducationalContentWithCategories = {
  id: string;
  title: string;
  description: string;
  categories: string[];
  link?: string;
  image?: string;
  imageBlob?: any;
  file?: string;
  fileBlob?: any;
  createdAt: string;
  updatedAt: string;
};

export type EducationalCategory = {
  id: string;
  category: string;
};
