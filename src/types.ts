export interface QuickLink {
  id: string;
  title: string;
  icon: string;
  color: string;
  link: string;
}

export interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  timestamp: number;
  views: number;
  content: string;
  isNew?: boolean;
}

export interface Todo {
  id: string;
  title: string;
  date?: string;
  assignee?: string;
  completed: boolean;
  timestamp: number;
}

export interface LinkItem {
  title: string;
  link: string;
  password?: string;
}

export interface Group {
  id: string;
  title: string;
  icon: string;
  color: string;
  password?: string;
  link?: string;
  items: LinkItem[];
}

export interface Category {
  id: string;
  type: 'menu' | 'board' | 'todo';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  password?: string;
  link?: string;
  colSpan?: number;
  posts?: Post[];
  todos?: Todo[];
  groups?: Group[];
}

export interface AppState {
  pageTitle: string;
  pageDescription: string;
  copyright: string;
  contactEmail: string;
  masterPassword?: string;
  columns: number;
  rows: number;
  quickLinkPosition: 'top' | 'bottom';
  quickLinkBarColor: string;
  quickLinks: QuickLink[];
  categories: Category[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface DeskMeta {
  siteID: string;
  siteName: string;
  adminId: string;
  adminPassword?: string;
}

