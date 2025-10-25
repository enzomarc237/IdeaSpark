
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isGenerated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type View = 'editor' | 'wireframe' | 'analyzer';