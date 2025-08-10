from fastapi import APIRouter, HTTPException
from models import User, DatabaseConnectionResponse, DatabaseConnectionCreate,Schema, DatabaseTable, QueryRequest, QueryResult, AIQueryRequest, AIQueryResponse
from connectDB import supabase
import uuid
import asyncpg
import os

router = APIRouter()

@router.post("/add-user")
def add_user(user: User):
    # Check if user exists
    response = supabase.table("users").select("id").eq("email", user.email).execute()

    if response.data:
        # User already exists – return the existing ID
        user_id = response.data[0]['id']
    else:
        # Create a new user
        new_user = {
            "name": user.name,
            "email": user.email,
            "picture": user.picture
        }
        insert_response = supabase.table("users").insert(new_user).select("id").execute()
        user_id = insert_response.data[0]['id']

    return {"message": "User added", "id": user_id}
  
async def check_db_connection(db_data: DatabaseConnectionCreate):
    try:
        if db_data.type == 'SQLite':
            import sqlite3
            conn = sqlite3.connect(db_data.database_name)
            conn.close()
            return True
        else:
            conn = await asyncpg.connect(
                user=db_data.username,
                password=db_data.password,
                database=db_data.database_name,
                host=db_data.host,
                port=db_data.port
            )
            await conn.close()
            return True
    except Exception as e:
        print(f"Connection failed: {str(e)}")
        return False
    
@router.post("/add-database", response_model=DatabaseConnectionResponse)
async def add_database(db: DatabaseConnectionCreate):
    user_response = supabase.table("users").select("id").eq("id", db.user_id).execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    is_connected = await check_db_connection(db)
    
    new_db = {
        "id": str(uuid.uuid4()),
        "user_id": db.user_id,
        "name": db.name,
        "type": db.type,
        "host": db.host,
        "port": db.port,
        "username": db.username,
        "password": db.password,
        "database_name": db.database_name,
        "status": "connected" if is_connected else "disconnected",
        "last_connected": "now()" if is_connected else None,
        "table_count": 0, 
        "total_rows": 0
    }

    response = supabase.table("database_connections").insert(new_db).execute()
    
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Failed to add database")

@router.get("/databases/{user_id}", response_model=list[DatabaseConnectionResponse])
async def get_databases(user_id: str):
    response = supabase.table("database_connections").select("*").eq("user_id", user_id).execute()
    return response.data

import sqlite3
from typing import List, Optional

async def get_postgres_schema(conn, db_name: str) -> List[DatabaseTable]:
    tables = []
    # Get all tables in the schema
    table_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
    """
    table_rows = await conn.fetch(table_query, 'public')
    
    for table_row in table_rows:
        table_name = table_row['table_name']
        
        # Get column information
        column_query = """
            SELECT 
                c.column_name,
                c.data_type,
                c.is_nullable = 'YES' AS nullable,
                c.column_default,
                (SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND tc.table_name = c.table_name
                    AND ccu.column_name = c.column_name
                )) AS is_primary_key,
                (SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_name = c.table_name
                    AND ccu.column_name = c.column_name
                )) AS is_foreign_key,
                (SELECT ccu.table_name
                 FROM information_schema.table_constraints tc
                 JOIN information_schema.constraint_column_usage ccu
                 ON tc.constraint_name = ccu.constraint_name
                 WHERE tc.constraint_type = 'FOREIGN KEY'
                 AND tc.table_name = c.table_name
                 AND ccu.column_name = c.column_name) AS fk_table,
                (SELECT ccu.column_name
                 FROM information_schema.table_constraints tc
                 JOIN information_schema.constraint_column_usage ccu
                 ON tc.constraint_name = ccu.constraint_name
                 WHERE tc.constraint_type = 'FOREIGN KEY'
                 AND tc.table_name = c.table_name
                 AND ccu.column_name = c.column_name) AS fk_column
            FROM information_schema.columns c
            WHERE c.table_schema = $1 AND c.table_name = $2
        """
        columns = await conn.fetch(column_query, 'public', table_name)
        
        # Get row count
        row_count_query = f"SELECT COUNT(*) FROM {table_name}"
        row_count = (await conn.fetchrow(row_count_query))['count']
        
        # Get table comment (description)
        comment_query = """
            SELECT obj_description(
                (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (
                    SELECT oid FROM pg_namespace WHERE nspname = $2
                )),
                'pg_class'
            ) AS description
        """
        description = await conn.fetchval(comment_query, table_name, 'public')
        
        tables.append({
            "name": table_name,
            "rowCount": row_count,
            "description": description,
            "columns": [
                {
                    "name": col['column_name'],
                    "type": col['data_type'],
                    "nullable": col['nullable'],
                    "default": col['column_default'],
                    "isPrimaryKey": col['is_primary_key'],
                    "isForeignKey": col['is_foreign_key'],
                    "foreignKeyTable": col['fk_table'],
                    "foreignKeyColumn": col['fk_column']
                } for col in columns
            ]
        })
    
    return tables

async def get_mysql_schema(conn, db_name: str) -> List[DatabaseTable]:
    tables = []
    # Get all tables
    table_query = f"SHOW TABLES FROM {db_name}"
    table_rows = await conn.fetch(table_query)
    
    for table_row in table_rows:
        table_name = table_row[f'Tables_in_{db_name}']
        
        # Get column information
        column_query = f"""
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE = 'YES' AS nullable,
                COLUMN_DEFAULT,
                COLUMN_KEY = 'PRI' AS is_primary_key,
                COLUMN_KEY = 'MUL' AS is_foreign_key,
                (SELECT REFERENCED_TABLE_NAME
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_NAME = c.TABLE_NAME
                 AND COLUMN_NAME = c.COLUMN_NAME
                 AND CONSTRAINT_NAME != 'PRIMARY') AS fk_table,
                (SELECT REFERENCED_COLUMN_NAME
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_NAME = c.TABLE_NAME
                 AND COLUMN_NAME = c.COLUMN_NAME
                 AND CONSTRAINT_NAME != 'PRIMARY') AS fk_column
            FROM information_schema.COLUMNS c
            WHERE TABLE_NAME = %s
        """
        columns = await conn.fetch(column_query, (table_name,))
        
        # Get row count
        row_count_query = f"SELECT COUNT(*) FROM {table_name}"
        row_count = (await conn.fetchrow(row_count_query))['count']
        
        # Get table comment
        comment_query = f"""
            SELECT TABLE_COMMENT 
            FROM information_schema.TABLES 
            WHERE TABLE_NAME = %s
        """
        description = await conn.fetchval(comment_query, (table_name,))
        
        tables.append({
            "name": table_name,
            "rowCount": row_count,
            "description": description,
            "columns": [
                {
                    "name": col['COLUMN_NAME'],
                    "type": col['DATA_TYPE'],
                    "nullable": col['nullable'],
                    "default": col['COLUMN_DEFAULT'],
                    "isPrimaryKey": col['is_primary_key'],
                    "isForeignKey": col['is_foreign_key'],
                    "foreignKeyTable": col['fk_table'],
                    "foreignKeyColumn": col['fk_column']
                } for col in columns
            ]
        })
    
    return tables

def get_sqlite_schema(conn, db_name: str) -> List[DatabaseTable]:
    tables = []
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    table_rows = cursor.fetchall()
    
    for table_row in table_rows:
        table_name = table_row[0]
        
        # Get column information
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        # Get foreign key information
        cursor.execute(f"PRAGMA foreign_key_list({table_name})")
        fk_info = {row[3]: (row[2], row[4]) for row in cursor.fetchall()}  # column: (table, column)
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]
        
        # Get table comment (SQLite doesn't support table comments natively)
        description = None
        
        tables.append({
            "name": table_name,
            "rowCount": row_count,
            "description": description,
            "columns": [
                {
                    "name": col[1],
                    "type": col[2],
                    "nullable": col[3] == 0,
                    "default": col[4],
                    "isPrimaryKey": col[5] == 1,
                    "isForeignKey": col[1] in fk_info,
                    "foreignKeyTable": fk_info.get(col[1], (None, None))[0],
                    "foreignKeyColumn": fk_info.get(col[1], (None, None))[1]
                } for col in columns
            ]
        })
    
    return tables

@router.get("/database/{db_id}", response_model=List[Schema])
async def get_database_details(db_id: str):
    # Fetch connection details
    response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = response.data[0]
    db_type = db_config['type']
    schema_name = 'public' if db_type == 'PostgreSQL' else db_config['database_name']
    
    try:
        if db_type == 'PostgreSQL':
            conn = await asyncpg.connect(
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database_name'],
                host=db_config['host'],
                port=db_config['port']
            )
            tables = await get_postgres_schema(conn, db_config['database_name'])
            await conn.close()
        elif db_type == 'MySQL':
            conn = await asyncpg.connect(  # Note: Replace with mysql-connector or pymysql in a real implementation
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database_name'],
                host=db_config['host'],
                port=db_config['port']
            )
            tables = await get_mysql_schema(conn, db_config['database_name'])
            await conn.close()
        else:  # SQLite
            conn = sqlite3.connect(db_config['database_name'])
            tables = get_sqlite_schema(conn, db_config['database_name'])
            conn.close()
        
        return [{"name": schema_name, "tables": tables}]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch database details: {str(e)}")

import sqlite3
from typing import List, Dict, Any


@router.get("/database/{db_id}/table/{table_name}/data", response_model=List[Dict[str, Any]])
async def get_table_data(db_id: str, table_name: str):
    # Fetch connection details
    response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = response.data[0]
    db_type = db_config['type']
    
    # Sanitize table_name to prevent SQL injection
    if not table_name.isalnum() and not table_name.replace('_', '').isalnum():
        raise HTTPException(status_code=400, detail="Invalid table name")
    
    try:
        if db_type == 'PostgreSQL':
            conn = await asyncpg.connect(
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database_name'],
                host=db_config['host'],
                port=db_config['port']
            )
            query = f"SELECT * FROM {table_name} LIMIT 25"
            rows = await conn.fetch(query)
            await conn.close()
            return [dict(row) for row in rows]
        elif db_type == 'MySQL':
            # Placeholder; use mysql-connector-python or pymysql in production
            raise HTTPException(status_code=501, detail="MySQL not implemented")
        else:  # SQLite
            conn = sqlite3.connect(db_config['database_name'])
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 25")
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            conn.close()
            return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch table data: {str(e)}")

from typing import List, Dict, Any
import google.generativeai as genai
import time

async def get_schema_info(db_config: Dict[str, Any], db_type: str) -> str:
    schema_info = []
    try:
        if db_type == 'PostgreSQL':
            conn = await asyncpg.connect(
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database_name'],
                host=db_config['host'],
                port=db_config['port']
            )
            table_query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            tables = await conn.fetch(table_query)
            for table in tables:
                table_name = table['table_name']
                column_query = """
                    SELECT 
                        column_name, 
                        data_type, 
                        is_nullable = 'YES' AS nullable,
                        column_default,
                        (SELECT EXISTS (
                            SELECT 1 
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.constraint_column_usage ccu
                            ON tc.constraint_name = ccu.constraint_name
                            WHERE tc.constraint_type = 'PRIMARY KEY'
                            AND tc.table_name = c.table_name
                            AND ccu.column_name = c.column_name
                        )) AS is_primary_key,
                        (SELECT EXISTS (
                            SELECT 1 
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.constraint_column_usage ccu
                            ON tc.constraint_name = ccu.constraint_name
                            WHERE tc.constraint_type = 'FOREIGN KEY'
                            AND tc.table_name = c.table_name
                            AND ccu.column_name = c.column_name
                        )) AS is_foreign_key,
                        (SELECT ccu.table_name
                         FROM information_schema.table_constraints tc
                         JOIN information_schema.constraint_column_usage ccu
                         ON tc.constraint_name = ccu.constraint_name
                         WHERE tc.constraint_type = 'FOREIGN KEY'
                         AND tc.table_name = c.table_name
                         AND ccu.column_name = c.column_name) AS fk_table,
                        (SELECT ccu.column_name
                         FROM information_schema.table_constraints tc
                         JOIN information_schema.constraint_column_usage ccu
                         ON tc.constraint_name = ccu.constraint_name
                         WHERE tc.constraint_type = 'FOREIGN KEY'
                         AND tc.table_name = c.table_name
                         AND ccu.column_name = c.column_name) AS fk_column
                    FROM information_schema.columns c
                    WHERE table_schema = 'public' AND table_name = $1
                """
                columns = await conn.fetch(column_query, table_name)
                comment_query = """
                    SELECT obj_description(
                        (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (
                            SELECT oid FROM pg_namespace WHERE nspname = 'public'
                        )),
                        'pg_class'
                    ) AS description
                """
                description = await conn.fetchval(comment_query, table_name)
                schema_info.append({
                    "table": table_name,
                    "description": description,
                    "columns": [
                        {
                            "name": col['column_name'],
                            "type": col['data_type'],
                            "nullable": col['nullable'],
                            "default": col['column_default'],
                            "isPrimaryKey": col['is_primary_key'],
                            "isForeignKey": col['is_foreign_key'],
                            "foreignKeyTable": col['fk_table'],
                            "foreignKeyColumn": col['fk_column']
                        } for col in columns
                    ]
                })
            await conn.close()
        else:  # SQLite
            conn = sqlite3.connect(db_config['database_name'])
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            for table in tables:
                table_name = table[0]
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                cursor.execute(f"PRAGMA foreign_key_list({table_name})")
                fk_info = {row[3]: (row[2], row[4]) for row in cursor.fetchall()}
                schema_info.append({
                    "table": table_name,
                    "description": None,
                    "columns": [
                        {
                            "name": col[1],
                            "type": col[2],
                            "nullable": col[3] == 0,
                            "default": col[4],
                            "isPrimaryKey": col[5] == 1,
                            "isForeignKey": col[1] in fk_info,
                            "foreignKeyTable": fk_info.get(col[1], (None, None))[0],
                            "foreignKeyColumn": fk_info.get(col[1], (None, None))[1]
                        } for col in columns
                    ]
                })
            conn.close()
        return "\n".join([
            f"Table: {table['table']}\nDescription: {table['description'] or 'None'}\nColumns:\n" +
            "\n".join([
                f"  - {col['name']} ({col['type']}, " +
                f"{'NOT NULL' if not col['nullable'] else 'NULLABLE'}, " +
                f"{'PRIMARY KEY' if col['isPrimaryKey'] else ''}, " +
                (f"FOREIGN KEY -> {col['foreignKeyTable']}.{col['foreignKeyColumn']}" if col['isForeignKey'] else '') +
                f"{', DEFAULT ' + str(col['default']) if col['default'] else ''})"
                for col in table['columns']
            ]) for table in schema_info
        ])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch schema: {str(e)}")

@router.post("/database/{db_id}/query", response_model=QueryResult)
async def execute_query(db_id: str, request: QueryRequest):
    response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = response.data[0]
    db_type = db_config['type']
    query = request.query
    
    start_time = time.time()
    try:
        if db_type == 'PostgreSQL':
            conn = await asyncpg.connect(
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database_name'],
                host=db_config['host'],
                port=db_config['port']
            )
            rows = await conn.fetch(query)
            columns = list(rows[0].keys()) if rows else []
            await conn.close()
            return {
                "columns": columns,
                "rows": [list(row) for row in rows],
                "rowCount": len(rows),
                "executionTime": (time.time() - start_time) * 1000,
                "error": None
            }
        else:  # SQLite
            conn = sqlite3.connect(db_config['database_name'])
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description] if cursor.description else []
            conn.close()
            return {
                "columns": columns,
                "rows": rows,
                "rowCount": len(rows),
                "executionTime": (time.time() - start_time) * 1000,
                "error": None
            }
    except Exception as e:
        return {
            "columns": [],
            "rows": [],
            "rowCount": 0,
            "executionTime": (time.time() - start_time) * 1000,
            "error": str(e)
        }

@router.post("/database/{db_id}/ai-query", response_model=AIQueryResponse)
async def generate_ai_query(db_id: str, request: AIQueryRequest):
    response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = response.data[0]
    db_type = db_config['type']
    
    schema_info = await get_schema_info(db_config, db_type)
    
    genai.configure(api_key=os.getenv("GEMINI_API_KEY")) 
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    system_prompt = f"""
You are an expert SQL query generator with knowledge of database schemas. Your task is to generate accurate and efficient SQL queries based on user prompts, considering the provided database schema. Ensure queries are safe, optimized, and compatible with {db_type}. Avoid generating queries that modify data (INSERT, UPDATE, DELETE) unless explicitly requested. If the prompt is unclear, return a safe default query with an explanation.

Database Schema:
{schema_info}

Instructions:
1. Generate a valid SQL query based on the user's prompt.
2. Provide a clear explanation of the query's purpose and structure.
3. Include a confidence score (0-100) based on how well the query matches the prompt.
4. Ensure the query is secure and avoids SQL injection risks.
5. Return the response in JSON format with fields: query, explanation, confidence.

Strict output Format:
```json
{{
  "query": "SQL Query here",
  "explanation": "About the query",
  "confidence": 0-100
}}
```

Example Response:
{{
  "query": "SELECT * FROM users LIMIT 10",
  "explanation": "retrieves the first 10 users from the users table.",
  "confidence": 90
}}
"""
    try:
        response = await model.generate_content_async(
            f"{system_prompt}\n\nUser Prompt: {request.prompt}"
        )
        result = response.text.strip()
        print(result)
        if result.startswith('```json') and result.endswith('```'):
            result = result[7:-3].strip()
        import json
        return json.loads(result)
    except Exception as e:
        return {
            "query": "SELECT * FROM users LIMIT 10",
            "explanation": f"Failed to generate query due to error: {str(e)}. Defaulting to a safe query.",
            "confidence": 60
        }

from models import APIGenerateRequest, GeneratedAPIDetails
import json
@router.post("/database/{db_id}/generate-api", response_model=GeneratedAPIDetails)
async def generate_api(db_id: str, request: APIGenerateRequest):
    response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = response.data[0]
    db_type = db_config['type']
    
    schema_info = await get_schema_info(db_config, db_type)
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    system_prompt = f"""
You are an expert API generator with knowledge of database schemas and OpenAPI specifications. Your task is to generate a complete API specification based on the user's prompt, considering the provided database schema and options. Ensure the API is secure, optimized, and compatible with {db_type}. Avoid generating queries that modify data unless explicitly allowed by the operationType option.

Database Schema:
{schema_info}

Options:
{json.dumps(request.options, indent=2)}

Instructions:
1. Generate a valid OpenAPI specification for a single endpoint.
2. Include method, path, parameters, requestBody (if applicable), responses, and security (if required).
3. Ensure the path is unique and follows REST conventions (e.g., /resource).
4. Map the prompt to a safe SQL query for the endpoint.
5. Provide a title, description, summary, and relevant tags.
6. Ensure all parameter `example` values are strings.
7. Ensure each response contains a valid JSON object in the `example` field (not an array).
8. Return the response in JSON format matching the strict output format exactly.

Strict Output Format (respond with only this object):
{{
  "id": "string",
  "title": "string",
  "description": "string",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "path": "string",
  "summary": "string",
  "tags": ["string"],
  "parameters": [
    {{
      "name": "string",
      "type": "string",
      "required": boolean,
      "description": "string",
      "example": "string"
    }}
  ],
  "requestBody": {{
    "required": boolean,
    "content": {{}},
    "description": "string"
  }},
  "responses": [
    {{
      "status": integer,
      "description": "string",
      "example": {{}}
    }}
  ],
  "security": ["string"],
  "createdAt": "string",
  "isPublished": boolean,
  "query": "string"
}}

Example Response:
{{
  "id": "api-123",
  "title": "Get Users",
  "description": "Retrieve a list of users",
  "method": "GET",
  "path": "/users",
  "summary": "Fetches all users from the database",
  "tags": ["Users"],
  "parameters": [
    {{
      "name": "limit",
      "type": "integer",
      "required": false,
      "description": "Number of users to return",
      "example": "10"
    }},
    {{
      "name": "offset",
      "type": "integer",
      "required": false,
      "description": "Offset for pagination",
      "example": "0"
    }}
  ],
  "requestBody": null,
  "responses": [
    {{
      "status": 200,
      "description": "A user object",
      "example": {{
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "picture": "https://example.com/john.jpg"
      }}
    }},
    {{
      "status": 500,
      "description": "Internal server error",
      "example": {{
        "error": "Internal server error"
      }}
    }}
  ],
  "security": [],
  "createdAt": "2025-08-03T10:12:00Z",
  "isPublished": false,
  "query": "SELECT id, name, email, picture FROM users LIMIT 10 OFFSET 0"
}}
"""


    try:
        response = await model.generate_content_async(
            f"{system_prompt}\n\nUser Prompt: {request.prompt}"
        )
        print(1)
        result = response.text.strip()
        if result.startswith('```json') and result.endswith('```'):
            result = result[7:-3].strip()
        api_spec = json.loads(result)
        print(2)
        
        api_spec['isPublished'] = False
        api_spec['id'] = str(uuid.uuid4())
        api_spec['createdAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        print(3)
        supabase.table("api_specs").insert({
            "id": api_spec['id'],
            "db_id": db_id,
            "spec": api_spec,
            "created_at": api_spec['createdAt']
        }).execute()
        print(4)
        
        return GeneratedAPIDetails(**api_spec)
    except json.JSONDecodeError as e:
        print("Invalid JSON:", result)
        raise HTTPException(status_code=500, detail=f"JSON decode error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate API: {str(e)}")

from fastapi import Request
from models import GeneratedAPIDetails
@router.post("/database/{db_id}/publish-api", response_model=dict)
async def publish_api(db_id: str, api_spec: GeneratedAPIDetails):
    response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = response.data[0]
    
    update_response = supabase.table("api_specs").update({
        "spec": {**api_spec.dict(), "isPublished": True, "publishedUrl": f"http://localhost:8000/{db_id}{api_spec.path}"}
    }).eq("id", api_spec.id).eq("db_id", db_id).execute()
    
    if not update_response.data:
        raise HTTPException(status_code=404, detail="API specification not found")
    
    return {"publishedUrl": f"http://localhost:8000/{db_id}{api_spec.path}"}

@router.get("/{db_id}/{endpoint:path}", response_model=dict)
@router.post("/{db_id}/{endpoint:path}", response_model=dict)
@router.put("/{db_id}/{endpoint:path}", response_model=dict)
@router.delete("/{db_id}/{endpoint:path}", response_model=dict)
@router.patch("/{db_id}/{endpoint:path}", response_model=dict)
async def handle_published_api(db_id: str, endpoint: str, request: Request):
    response = supabase.table("api_specs").select("spec").eq("db_id", db_id).eq("spec->>path", f"/{endpoint}").execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    api_spec = response.data[0]["spec"]
    if not api_spec.get("isPublished"):
        raise HTTPException(status_code=403, detail="API is not published")
    
    db_response = supabase.table("database_connections").select("*").eq("id", db_id).execute()
    if not db_response.data:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    db_config = db_response.data[0]
    db_type = db_config['type']
    query = api_spec.get("query")
    
    if not query:
        raise HTTPException(status_code=500, detail="No query defined for this API")
    
    query_params = dict(request.query_params)
    sanitized_query = query
    for param, value in query_params.items():
        if any(p['name'] == param for p in api_spec.get("parameters", [])):
            sanitized_value = value.replace("'", "''")
            sanitized_query = sanitized_query.replace(f":{param}", sanitized_value)
    
    start_time = time.time()
    try:
        if db_type == 'PostgreSQL':
            conn = await asyncpg.connect(
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database_name'],
                host=db_config['host'],
                port=db_config['port']
            )
            rows = await conn.fetch(sanitized_query)
            columns = list(rows[0].keys()) if rows else []
            await conn.close()
            return {
                "columns": columns,
                "rows": [dict(row) for row in rows],
                "rowCount": len(rows),
                "executionTime": (time.time() - start_time) * 1000
            }
        else:  # SQLite
            conn = sqlite3.connect(db_config['database_name'])
            cursor = conn.cursor()
            cursor.execute(sanitized_query)
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description] if cursor.description else []
            conn.close()
            return {
                "columns": columns,
                "rows": [dict(zip(columns, row)) for row in rows],
                "rowCount": len(rows),
                "executionTime": (time.time() - start_time) * 1000
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")
