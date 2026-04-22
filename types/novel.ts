export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  volumes: Volume[];
}
