import React, { useState, useRef, useEffect } from 'react';
import {useNavigate } from 'react-router-dom';

import { 
  Play, 
  Square, 
  Save, 
  History, 
  Download, 
  Upload,
  Settings,
  Database,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Trash2,
  ArrowLeft,
  Bot,
  User,
  Loader2,
  Activity,
  Code,
  BarChart3
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { executeQuery, generateAIQuery, getDatabaseDetails } from '../utils/api';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  error?: string;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  executionTime?: number;
  status: 'success' | 'error';
  rowCount?: number;
}

interface AIResponse {
  query: string;
  explanation: string;
  confidence: number;
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

interface Schema {
  name: string;
  tables: DatabaseTable[];
}

const QueryShell = () => {  
  const { db_id } = useParams<{ db_id: string }>();
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'ai'>('editor');
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<{type: 'user' | 'ai', content: string, query?: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [schema, setSchema] = useState<Schema[]>([]);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchSchema = async () => {
      if (!db_id) {
        setSchemaError('No database ID provided');
        return;
      }
      try {
        const data = await getDatabaseDetails(db_id);
        setSchema(data);
        setSchemaError(null);
      } catch (error) {
        setSchemaError('Failed to fetch database schema');
      }
    };
    fetchSchema();
  }, [db_id]);

  const executeQueryShell = async (sqlQuery: string): Promise<QueryResult> => {
    if (!db_id) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: 'No database ID provided'
      };
    }
    setIsExecuting(true);
    try {
      const result = await executeQuery(db_id, sqlQuery);
      return result;
    } catch (error) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsExecuting(false);
    }
  };

  const generateAIQueryAgent = async (prompt: string): Promise<AIResponse> => {
    if (!db_id) {
      return {
        query: 'SELECT * FROM users LIMIT 10',
        explanation: 'No database ID provided. Defaulting to a safe query.',
        confidence: 60
      };
    }
    try {
      const response = await generateAIQuery(db_id, prompt);
      return response;
    } catch (error) {
      return {
        query: 'SELECT * FROM users LIMIT 10',
        explanation: `Failed to generate query: ${error instanceof Error ? error.message : 'Unknown error'}. Defaulting to a safe query.`,
        confidence: 60
      };
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;

    const result = await executeQueryShell(query);
    setResults(result);
    
    const historyItem: QueryHistory = {
      id: Date.now().toString(),
      query: query,
      timestamp: new Date(),
      executionTime: result.executionTime,
      status: result.error ? 'error' : 'success',
      rowCount: result.rowCount
    };
    setQueryHistory(prev => [historyItem, ...prev]);
  };

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;

    const userMessage = { type: 'user' as const, content: aiPrompt };
    setAiMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setAiPrompt('');

    try {
      const aiResponse = await generateAIQueryAgent(aiPrompt);
      const aiMessage = {
        type: 'ai' as const,
        content: aiResponse.explanation,
        query: aiResponse.query
      };
      setAiMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai' as const,
        content: 'Sorry, I encountered an error generating the query. Please try again with a different prompt.'
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const insertAIQuery = (aiQuery: string) => {
    setQuery(aiQuery);
    setActiveTab('editor');
  };

  const insertHistoryQuery = (historyQuery: string) => {
    setQuery(historyQuery);
    setActiveTab('editor');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleExecuteQuery();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/5 rounded-full blur-lg"></div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => navigate(`/database/${db_id}`)} 
                              className="flex items-center text-gray-300 hover:text-white transition-colors"
                            >
                              <ArrowLeft className="w-5 h-5 mr-2" />
                              Back to Database View
                            </button>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Query Shell</h1>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Production DB Connected</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-lg flex items-center transition-all">
                <Save className="w-4 h-4 mr-2" />
                Save Query
              </button>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-lg flex items-center transition-all">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Query Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Query Editor */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Code className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-white text-lg">SQL Editor</h2>
                  </div>
                  <button
                    onClick={handleExecuteQuery}
                    disabled={isExecuting || !query.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl flex items-center text-sm font-medium transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Query
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-300">
                  Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl+Enter</kbd> to execute query
                </p>
              </div>
              
              <div className="p-0">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="-- Enter your SQL query here&#10;SELECT * FROM users&#10;WHERE created_at > '2024-01-01'&#10;ORDER BY created_at DESC&#10;LIMIT 10;"
                  className="w-full h-80 p-6 font-mono text-sm bg-transparent text-white placeholder-gray-400 border-0 resize-none focus:outline-none focus:ring-0"
                  style={{ fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace' }}
                />
              </div>
            </div>

            {/* Query Results */}
            {results && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-white text-lg">Results</h3>
                      </div>
                      {results.error ? (
                        <div className="flex items-center px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                          <XCircle className="w-4 h-4 mr-2 text-red-400" />
                          <span className="text-sm text-red-300">Error</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                            <span className="text-sm text-green-300">{results.rowCount} rows</span>
                          </div>
                          <div className="flex items-center px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                            <Clock className="w-4 h-4 mr-2 text-blue-400" />
                            <span className="text-sm text-blue-300">{results.executionTime}ms</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {!results.error && (
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white rounded-lg flex items-center transition-all">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {results.error ? (
                    <div className="p-6">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                        <div className="flex items-start">
                          <AlertCircle className="w-6 h-6 text-red-400 mr-4 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-red-300 mb-2">Query Error</h4>
                            <p className="text-sm text-red-200 font-mono">{results.error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            {results.columns.map((column, index) => (
                              <th
                                key={index}
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-4 text-sm text-gray-200 font-mono">
                                  {cell === null ? (
                                    <span className="text-gray-500 italic">NULL</span>
                                  ) : (
                                    String(cell)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex space-x-1 bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                      activeTab === 'editor' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Schema
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                      activeTab === 'ai' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                      activeTab === 'history' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    History
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {activeTab === 'editor' && (
                  <div>
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <Database className="w-4 h-4 mr-2 text-blue-400" />
                      Database Schema
                    </h4>
                    {schemaError ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <p className="text-sm text-red-300">{schemaError}</p>
                      </div>
                    ) : schema.length === 0 ? (
                      <div className="text-sm text-gray-300">Loading schema...</div>
                    ) : (
                      <div className="space-y-3">
                        {schema[0]?.tables.map((table) => (
                          <div key={table.name} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-center mb-3">
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <Database className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-white">{table.name}</span>
                              <span className="ml-auto text-xs text-gray-400">{table.columns.length} columns</span>
                            </div>
                            <div className="space-y-1">
                              {table.columns.map((column) => (
                                <div key={column.name} className="text-xs text-gray-300 font-mono pl-6 py-1 hover:text-white transition-colors">
                                  • {column.name} ({column.type}
                                  {column.isPrimaryKey ? ', PK' : ''}
                                  {column.isForeignKey ? `, FK -> ${column.foreignKeyTable}.${column.foreignKeyColumn}` : ''}
                                  {column.nullable ? '' : ', NOT NULL'}
                                  {column.default ? `, DEFAULT ${column.default}` : ''})
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div>
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <Bot className="w-4 h-4 mr-2 text-purple-400" />
                      AI Query Assistant
                    </h4>
                    
                    {/* AI Messages */}
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {aiMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl p-3 ${
                            message.type === 'user' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                              : 'bg-white/10 border border-white/20 text-gray-200'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {message.type === 'ai' ? (
                                <Bot className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                              ) : (
                                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm">{message.content}</p>
                                {message.query && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => insertAIQuery(message.query!)}
                                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                                    >
                                      Use Query
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 border border-white/20 rounded-xl p-3">
                            <div className="flex items-center space-x-2">
                              <Bot className="w-4 h-4 text-purple-400" />
                              <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                              <span className="text-sm text-gray-300">Generating query...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Input */}
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
                        placeholder="Describe the query you need..."
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      />
                      <button
                        onClick={handleAISubmit}
                        disabled={!aiPrompt.trim() || isAiLoading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl text-sm flex items-center justify-center font-medium transition-all"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Generate Query
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h4 className="font-semibold text-white mb-4 flex items-center">
                      <History className="w-4 h-4 mr-2 text-green-400" />
                      Query History
                    </h4>
                    <div className="space-y-3">
                      {queryHistory.length === 0 ? (
                        <div className="text-sm text-gray-300">No query history available</div>
                      ) : (
                        queryHistory.map((item) => (
                          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                {item.status === 'success' ? (
                                  <div className="w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                                    <XCircle className="w-3 h-3 text-red-400" />
                                  </div>
                                )}
                                <span className="text-xs text-gray-400">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              <button
                                onClick={() => insertHistoryQuery(item.query)}
                                className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                Use Query
                              </button>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
                              <p className="text-xs font-mono text-gray-300 leading-relaxed">
                                {item.query.length > 120 ? `${item.query.substring(0, 120)}...` : item.query}
                              </p>
                            </div>
                            {item.status === 'success' && (
                              <div className="flex items-center space-x-4 text-xs">
                                {item.rowCount !== undefined && (
                                  <div className="flex items-center px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <span className="text-green-300">{item.rowCount} rows</span>
                                  </div>
                                )}
                                {item.executionTime && (
                                  <div className="flex items-center px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                    <Clock className="w-3 h-3 mr-1 text-blue-400" />
                                    <span className="text-blue-300">{item.executionTime}ms</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryShell;