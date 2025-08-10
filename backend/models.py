from pydantic import BaseModel
from typing import Literal, Dict

class User(BaseModel):
    id: str
    name: str
    email: str
    picture: str

class DatabaseConnectionCreate(BaseModel):
    name: str
    type: Literal['MySQL', 'PostgreSQL', 'SQLite']
    host: str
    port: int
    username: str
    password: str
    database_name: str
    user_id: str

class DatabaseConnectionResponse(BaseModel):
    id: str
    name: str
    type: str
    host: str
    port: int
    status: str
    last_connected: str
    table_count: int
    total_rows: int

from typing import List, Optional, Any

class Column(BaseModel):
    name: str
    type: str
    nullable: bool
    default: Optional[str]
    isPrimaryKey: bool
    isForeignKey: bool
    foreignKeyTable: Optional[str]
    foreignKeyColumn: Optional[str]

class DatabaseTable(BaseModel):
    name: str
    rowCount: int
    columns: List[Column]
    description: Optional[str]

class Schema(BaseModel):
    name: str
    tables: List[DatabaseTable]

class QueryRequest(BaseModel):
    query: str

class QueryResult(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    rowCount: int
    executionTime: float
    error: Optional[str]

class AIQueryRequest(BaseModel):
    prompt: str

class AIQueryResponse(BaseModel):
    query: str
    explanation: str
    confidence: float

class APIParameter(BaseModel):
    name: str
    type: str
    required: bool
    description: str
    example: Optional[str] = None

class APIRequestBody(BaseModel):
    required: bool
    content: Dict[str, Any]
    description: str

class APIResponse(BaseModel):
    status: int
    description: str
    example: Dict[str, Any]
    
class GeneratedAPIDetails(BaseModel):
    id: str
    title: str
    description: str
    method: str
    path: str
    summary: str
    tags: List[str]
    parameters: List[APIParameter]
    requestBody: Optional[APIRequestBody] = None
    responses: List[APIResponse]
    security: Optional[List[str]] = None
    createdAt: str
    isPublished: bool
    publishedUrl: Optional[str] = None
    query: Optional[str] = None  # Store the generated SQL query

class APIGenerateRequest(BaseModel):
    prompt: str
    options: Dict[str, Any]