export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// export interface DatabaseConnection {
//   id: string;
//   userId: string;
//   type: 'mysql' | 'postgresql' | 'sqlite';
//   host: string;
//   port: number;
//   username: string;
//   password: string;
//   database: string;
// }

export interface DatabaseConnection {
    id: string;
    name: string;
    type: 'MySQL' | 'PostgreSQL' | 'SQLite';
    host: string;
    port: number;
    status: 'connected' | 'disconnected' | 'connecting';
    last_connected: string;
    table_count: number;
    total_rows: number;
}

export interface DBConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TableSchema {
  name: string;
  columns: { name: string; type: string }[];
}

export interface APIConfig {
  table: string;
  operations: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  authRequired: boolean;
  pagination: boolean;
}

interface Column {
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    foreignKeyTable?: string;
    foreignKeyColumn?: string;
}

interface DatabaseTable {
    name: string;
    rowCount: number;
    columns: Column[];
    description?: string;
}

export interface Schema {
    name: string;
    tables: DatabaseTable[];
}

export interface DatabaseConnectionCreate {
    name: string;
    type: 'MySQL' | 'PostgreSQL' | 'SQLite';
    host: string;
    port: number;
    username: string;
    password: string;
    database_name: string;
    user_id: string;
}

export interface QueryResult {
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTime: number;
    error?: string;
}

export interface AIQueryResponse {
    query: string;
    explanation: string;
    confidence: number;
}

interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface APIRequestBody {
  required: boolean;
  content: any;
  description: string;
}

interface APIResponse {
  status: number;
  description: string;
  example: any;
}

export interface GeneratedAPIDetails {
  id: string;
  title: string;
  description: string;
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  security?: string[];
  createdAt: string;
  isPublished: boolean;
  publishedUrl?: string;
}

