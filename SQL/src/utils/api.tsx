import type{ DatabaseConnection,Schema, DatabaseConnectionCreate,AIQueryResponse, QueryResult, GeneratedAPIDetails } from '../types';
import axios from 'axios';


export const addDatabase = async (db: DatabaseConnectionCreate): Promise<DatabaseConnection> => {
    const response = await fetch('http://localhost:8000/add-database', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(db),
    });

    if (!response.ok) {
        throw new Error('Failed to add database');
    }

    return response.json();
};

export const getDatabases = async (userId: string): Promise<DatabaseConnection[]> => {
    const response = await fetch(`http://localhost:8000/databases/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch databases');
    }

    return response.json();
};

export const getDatabaseDetails = async (dbId: string): Promise<Schema[]> => {
    const response = await fetch(`http://localhost:8000/database/${dbId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch database details');
    }

    return response.json();
};

interface TableRow {
    [key: string]: any;
}

export const getTableData = async (dbId: string, tableName: string): Promise<TableRow[]> => {
    const response = await fetch(`http://localhost:8000/database/${dbId}/table/${tableName}/data`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch table data');
    }

    return response.json();
};


export const executeQuery = async (dbId: string, query: string): Promise<QueryResult> => {
    const response = await fetch(`http://localhost:8000/database/${dbId}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        throw new Error('Failed to execute query');
    }

    return response.json();
};

export const generateAIQuery = async (dbId: string, prompt: string): Promise<AIQueryResponse> => {
    const response = await fetch(`http://localhost:8000/database/${dbId}/ai-query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate AI query');
    }

    return response.json();
};

export const generateAPI = async (db_id: string, prompt: string, options: any): Promise<GeneratedAPIDetails> => {
  const response = await axios.post(`http://localhost:8000/database/${db_id}/generate-api`, {
    prompt,
    options
  });
  return response.data;
};

export const publishAPI = async (db_id: string, apiSpec: GeneratedAPIDetails): Promise<string> => {
  const response = await axios.post(`http://localhost:8000/database/${db_id}/publish-api`, apiSpec);
  return response.data.publishedUrl;
};