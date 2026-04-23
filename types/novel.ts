export interface Chapter {
  id: string;
  title: string;
  content: string;
  order?: number;
}

export interface Volume {
  id: string;
  title: string;
  order?: number;
  chapters: Chapter[];
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  volumes: Volume[];
}
