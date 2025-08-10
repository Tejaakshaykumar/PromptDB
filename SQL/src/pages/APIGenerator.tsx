import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Zap, 
  Settings, 
  Code, 
  Copy, 
  Globe, 
  CheckCircle, 
  Loader2, 
  Bot, 
  Play, 
  Database,
  Activity
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import APITester from './APITester';
import { getDatabaseDetails, generateAPI, publishAPI } from '../utils/api';

// Types
interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface APIResponse {
  status: number;
  description: string;
  example: any;
}

interface GeneratedAPIDetails {
  id: string;
  title: string;
  description: string;
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: {
    required: boolean;
    content: any;
    description: string;
  };
  responses: APIResponse[];
  security?: string[];
  createdAt: string;
  isPublished: boolean;
  publishedUrl?: string;
}

interface FormDataField {
  key: string;
  type: 'text' | 'file';
  value: string;
  file?: File;
}

interface TestRequest {
  method: string;
  url: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  body: {
    type: 'none' | 'formdata' | 'raw' | 'binary';
    formData: FormDataField[];
    raw: {
      content: string;
      format: 'text' | 'json' | 'xml' | 'html';
    };
    binary?: File;
  };
}

interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
}

const APIGenerator: React.FC = () => {
  const { db_id } = useParams<{ db_id: string }>();
  const [activeTab, setActiveTab] = useState<'generator' | 'tester'>('generator');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAPI, setGeneratedAPI] = useState<GeneratedAPIDetails | null>(null);
  const [apiOptions, setApiOptions] = useState({
    requireAuth: false,
    enableCors: true,
    includeHeaders: false,
    operationType: 'read' as 'read' | 'write' | 'both',
    responseFormat: 'json' as 'json' | 'xml',
    enablePagination: false,
    enableFiltering: false
  });
  const [testRequest, setTestRequest] = useState<TestRequest>({
    method: 'GET',
    url: '',
    params: {},
    headers: { 'Content-Type': 'application/json' },
    auth: { type: 'none' },
    body: {
      type: 'none',
      formData: [],
      raw: { content: '', format: 'json' },
    }
  });
  const [testResponse, setTestResponse] = useState<TestResponse | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<any | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnectionDetails = async () => {
      if (!db_id) {
        setConnectionError('No database ID provided');
        return;
      }
      try {
        const data = await getDatabaseDetails(db_id);
        setConnectionDetails(data[0]); // Schema object
        setConnectionError(null);
      } catch (error) {
        setConnectionError('Failed to fetch database schema details');
      }
    };
    fetchConnectionDetails();
  }, [db_id]);

  const generateAPIFromPrompt = async (userPrompt: string) => {
    if (!db_id || !connectionDetails) {
      setGeneratedAPI({
        id: `api-${Date.now()}`,
        title: 'Error API',
        description: 'Failed to generate API: No database connection',
        method: 'GET',
        path: 'http://localhost:8000/error',
        summary: 'Error endpoint',
        tags: ['Error'],
        parameters: [],
        responses: [
          {
            status: 500,
            description: 'Internal server error',
            example: { error: 'No database connection' }
          }
        ],
        createdAt: new Date().toISOString(),
        isPublished: false
      });
      return;
    }

    setIsGenerating(true);
    try {
      const apiSpec = await generateAPI(db_id, userPrompt, apiOptions);
      setGeneratedAPI(apiSpec);
    } catch (error) {
      setGeneratedAPI({
        id: `api-${Date.now()}`,
        title: 'Error API',
        description: `Failed to generate API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        method: 'GET',
        path: 'http://localhost:8000/error',
        summary: 'Error endpoint',
        tags: ['Error'],
        parameters: [],
        responses: [
          {
            status: 500,
            description: 'Internal server error',
            example: { error: 'Failed to generate API' }
          }
        ],
        createdAt: new Date().toISOString(),
        isPublished: false
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishAPI = async () => {
    if (!generatedAPI || !db_id) return;

    try {
      const publishedUrl = await publishAPI(db_id, generatedAPI);
      setGeneratedAPI(prev => prev ? { ...prev, isPublished: true, publishedUrl } : null);
    } catch (error) {
      setGeneratedAPI(prev => prev ? {
        ...prev,
        isPublished: false,
        publishedUrl: undefined
      } : null);
    }
  };

  const handleGenerateAPI = async () => {
    if (!prompt.trim()) return;
    await generateAPIFromPrompt(prompt);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/5 rounded-full blur-lg"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
          <div className="border-b border-white/10 p-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI API Generator</h1>
                <p className="text-gray-300 mt-1">
                  {connectionError ? (
                    <span className="text-red-400">{connectionError}</span>
                  ) : connectionDetails ? (
                    `Connected to ${connectionDetails.name}`
                  ) : (
                    'Loading database connection...'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-white/10">
            <nav className="flex space-x-1 px-8 py-2">
              <button
                onClick={() => setActiveTab('generator')}
                className={`py-4 px-6 font-medium text-sm rounded-xl transition-all ${
                  activeTab === 'generator'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                AI Generator
              </button>
              <button
                onClick={() => setActiveTab('tester')}
                className={`py-4 px-6 font-medium text-sm rounded-xl transition-all ${
                  activeTab === 'tester'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Play className="w-4 h-4 inline mr-2" />
                API Tester
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'generator' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-purple-400" />
                      AI Prompt
                    </h2>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Describe the API you want to generate
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Get all users who placed orders in the last month with their total order value, grouped by category"
                        className="w-full h-32 p-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
                      />
                    </div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-blue-400" />
                        API Options
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={apiOptions.requireAuth}
                              onChange={(e) => setApiOptions(prev => ({ ...prev, requireAuth: e.target.checked }))}
                              className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50"
                            />
                            <span className="ml-3 text-sm text-gray-300">Require Authentication</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={apiOptions.enableCors}
                              onChange={(e) => setApiOptions(prev => ({ ...prev, enableCors: e.target.checked }))}
                              className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50"
                            />
                            <span className="ml-3 text-sm text-gray-300">Enable CORS</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={apiOptions.enablePagination}
                              onChange={(e) => setApiOptions(prev => ({ ...prev, enablePagination: e.target.checked }))}
                              className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50"
                            />
                            <span className="ml-3 text-sm text-gray-300">Enable Pagination</span>
                          </label>
                        </div>
                        <div className="space-y-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={apiOptions.includeHeaders}
                              onChange={(e) => setApiOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                              className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50"
                            />
                            <span className="ml-3 text-sm text-gray-300">Custom Headers</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={apiOptions.enableFiltering}
                              onChange={(e) => setApiOptions(prev => ({ ...prev, enableFiltering: e.target.checked }))}
                              className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50"
                            />
                            <span className="ml-3 text-sm text-gray-300">Advanced Filtering</span>
                          </label>
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Operation Type</label>
                            <select
                              value={apiOptions.operationType}
                              onChange={(e) => setApiOptions(prev => ({ ...prev, operationType: e.target.value as any }))}
                              className="w-full p-3 text-sm bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                            >
                              <option value="read">Read Only</option>
                              <option value="write">Write Only</option>
                              <option value="both">Read & Write</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateAPI}
                      disabled={!prompt.trim() || isGenerating || !connectionDetails}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating API...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate API with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <Code className="w-5 h-5 mr-2 text-green-400" />
                    Generated API
                  </h2>
                  {!generatedAPI ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-300 text-lg">Enter a prompt to generate your API</p>
                      <p className="text-gray-400 text-sm mt-2">AI will create a complete API specification</p>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-white/10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{generatedAPI.title}</h3>
                            <p className="text-sm text-gray-300 mt-2">{generatedAPI.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {generatedAPI.tags.map((tag) => (
                              <span key={tag} className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                            generatedAPI.method === 'GET' ? 'bg-green-500/20 border border-green-500/30 text-green-300' :
                            generatedAPI.method === 'POST' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' :
                            generatedAPI.method === 'PUT' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300' :
                            'bg-red-500/20 border border-red-500/30 text-red-300'
                          }`}>
                            {generatedAPI.method}
                          </span>
                          <code className="text-sm bg-white/10 border border-white/20 px-3 py-1 rounded-lg flex-1 text-gray-300 font-mono">
                            {generatedAPI.path}
                          </code>
                          <button
                            onClick={() => copyToClipboard(generatedAPI.path)}
                            className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        {generatedAPI.parameters.length > 0 && (
                          <div>
                            <h4 className="font-medium text-white mb-3 flex items-center">
                              <Settings className="w-4 h-4 mr-2 text-blue-400" />
                              Parameters
                            </h4>
                            <div className="space-y-3">
                              {generatedAPI.parameters.map((param) => (
                                <div key={param.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <code className="text-sm font-medium text-blue-300">{param.name}</code>
                                    <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded">{param.type}</span>
                                    {param.required && (
                                      <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-1 rounded">required</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-300 mb-2">{param.description}</p>
                                  {param.example && (
                                    <code className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">Example: {param.example}</code>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {generatedAPI.requestBody && (
                          <div>
                            <h4 className="font-medium text-white mb-3 flex items-center">
                              <Code className="w-4 h-4 mr-2 text-green-400" />
                              Request Body
                            </h4>
                            <div className="p-4 bg-gray-900/50 border border-white/10 rounded-xl text-green-400 text-sm font-mono overflow-auto">
                              <pre>{JSON.stringify(generatedAPI.requestBody.content, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-white mb-3 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-purple-400" />
                            Responses
                          </h4>
                          <div className="space-y-3">
                            {generatedAPI.responses.map((response) => (
                              <details key={response.status} className="bg-white/5 border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <span className={`font-medium ${getStatusColor(response.status)}`}>
                                      {response.status}
                                    </span>
                                    <span className="text-sm text-gray-300">{response.description}</span>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </summary>
                                <div className="p-4 border-t border-white/10 bg-gray-900/50 text-green-400 text-sm font-mono">
                                  <pre>{JSON.stringify(response.example, null, 2)}</pre>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                          {!generatedAPI.isPublished ? (
                            <button
                              onClick={handlePublishAPI}
                              disabled={!connectionDetails}
                              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Globe className="w-4 h-4" />
                              <span>Publish API</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-300 text-sm font-medium">Published</span>
                            </div>
                          )}
                          {generatedAPI.publishedUrl && (
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={generatedAPI.publishedUrl}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 text-gray-300 rounded-lg backdrop-blur-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(generatedAPI.publishedUrl!)}
                                className="flex items-center space-x-1 text-gray-400 hover:text-white px-3 py-2 border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setTestRequest(prev => ({
                                ...prev,
                                method: generatedAPI.method,
                                url: generatedAPI.publishedUrl || generatedAPI.path
                              }));
                              setActiveTab('tester');
                            }}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all font-medium"
                          >
                            <Play className="w-4 h-4" />
                            <span>Test API</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <APITester
                testRequest={testRequest}
                setTestRequest={setTestRequest}
                testResponse={testResponse}
                setTestResponse={setTestResponse}
                getStatusColor={getStatusColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIGenerator;