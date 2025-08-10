// import React, { useState, useRef } from 'react';
// import { 
//   Play, 
//   Copy, 
//   Send, 
//   Settings, 
//   Lock, 
//   FileText, 
//   Code, 
//   Upload, 
//   Loader2, 
//   Activity, 
//   Trash2, 
//   Plus 
// } from 'lucide-react';

// interface FormDataField {
//   key: string;
//   type: 'text' | 'file';
//   value: string;
//   file?: File;
// }

// interface TestRequest {
//   method: string;
//   url: string;
//   params: Record<string, string>;
//   headers: Record<string, string>;
//   auth: {
//     type: 'none' | 'bearer' | 'basic' | 'api-key';
//     token?: string;
//     username?: string;
//     password?: string;
//     apiKey?: string;
//     apiKeyHeader?: string;
//   };
//   body: {
//     type: 'none' | 'formdata' | 'raw' | 'binary';
//     formData: FormDataField[];
//     raw: {
//       content: string;
//       format: 'text' | 'json' | 'xml' | 'html';
//     };
//     binary?: File;
//   };
// }

// interface TestResponse {
//   status: number;
//   statusText: string;
//   headers: Record<string, string>;
//   data: any;
//   responseTime: number;
// }

// interface APITesterProps {
//   testRequest: TestRequest;
//   setTestRequest: React.Dispatch<React.SetStateAction<TestRequest>>;
//   testResponse: TestResponse | null;
//   setTestResponse: React.Dispatch<React.SetStateAction<TestResponse | null>>;
//   getStatusColor: (status: number) => string;
// }

// const APITester: React.FC<APITesterProps> = ({
//   testRequest,
//   setTestRequest,
//   testResponse,
//   setTestResponse,
//   getStatusColor
// }) => {
//   const [activeSection, setActiveSection] = useState<'params' | 'auth' | 'headers' | 'body'>('params');
//   const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
//   const [isLoading, setIsLoading] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleTestAPI = async () => {
//     setIsLoading(true);
//     const startTime = Date.now();

//     try {
//       const headers = { ...testRequest.headers };
//       if (testRequest.auth.type === 'bearer' && testRequest.auth.token) {
//         headers['Authorization'] = `Bearer ${testRequest.auth.token}`;
//       } else if (testRequest.auth.type === 'basic' && testRequest.auth.username && testRequest.auth.password) {
//         headers['Authorization'] = `Basic ${btoa(`${testRequest.auth.username}:${testRequest.auth.password}`)}`;
//       } else if (testRequest.auth.type === 'api-key' && testRequest.auth.apiKey && testRequest.auth.apiKeyHeader) {
//         headers[testRequest.auth.apiKeyHeader] = testRequest.auth.apiKey;
//       }

//       let body: BodyInit | undefined;
//       if (testRequest.body.type === 'raw' && testRequest.body.raw.content) {
//         body = testRequest.body.raw.content;
//       } else if (testRequest.body.type === 'formdata' && testRequest.body.formData.length > 0) {
//         const formData = new FormData();
//         testRequest.body.formData.forEach(field => {
//           if (field.type === 'text') {
//             formData.append(field.key, field.value);
//           } else if (field.file) {
//             formData.append(field.key, field.file);
//           }
//         });
//         body = formData;
//       } else if (testRequest.body.type === 'binary' && testRequest.body.binary) {
//         body = testRequest.body.binary;
//       }

//       const url = new URL(testRequest.url);
//       Object.entries(testRequest.params).forEach(([key, value]) => {
//         if (key && value) url.searchParams.append(key, value);
//       });

//       const response = await fetch(url.toString(), {
//         method: testRequest.method,
//         headers,
//         body: testRequest.body.type !== 'none' ? body : undefined
//       });

//       const responseHeaders: Record<string, string> = {};
//       response.headers.forEach((value, key) => {
//         responseHeaders[key] = value;
//       });

//       const data = response.headers.get('content-type')?.includes('application/json')
//         ? await response.json()
//         : await response.text();

//       setTestResponse({
//         status: response.status,
//         statusText: response.statusText,
//         headers: responseHeaders,
//         data,
//         responseTime: Date.now() - startTime
//       });
//     } catch (error) {
//       setTestResponse({
//         status: 500,
//         statusText: 'Error',
//         headers: {},
//         data: { error: error instanceof Error ? error.message : 'Unknown error' },
//         responseTime: Date.now() - startTime
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const addParam = () => {
//     setTestRequest(prev => ({
//       ...prev,
//       params: { ...prev.params, '': '' }
//     }));
//   };

//   const updateParam = (oldKey: string, newKey: string, value: string) => {
//     setTestRequest(prev => {
//       const newParams = { ...prev.params };
//       if (oldKey !== newKey) {
//         delete newParams[oldKey];
//       }
//       newParams[newKey] = value;
//       return { ...prev, params: newParams };
//     });
//   };

//   const removeParam = (key: string) => {
//     setTestRequest(prev => {
//       const newParams = { ...prev.params };
//       delete newParams[key];
//       return { ...prev, params: newParams };
//     });
//   };

//   const addHeader = () => {
//     setTestRequest(prev => ({
//       ...prev,
//       headers: { ...prev.headers, '': '' }
//     }));
//   };

//   const updateHeader = (oldKey: string, newKey: string, value: string) => {
//     setTestRequest(prev => {
//       const newHeaders = { ...prev.headers };
//       if (oldKey !== newKey) {
//         delete newHeaders[oldKey];
//       }
//       newHeaders[newKey] = value;
//       return { ...prev, headers: newHeaders };
//     });
//   };

//   const removeHeader = (key: string) => {
//     setTestRequest(prev => {
//       const newHeaders = { ...prev.headers };
//       delete newHeaders[key];
//       return { ...prev, headers: newHeaders };
//     });
//   };

//   const addFormDataField = () => {
//     setTestRequest(prev => ({
//       ...prev,
//       body: {
//         ...prev.body,
//         formData: [...prev.body.formData, { key: '', type: 'text', value: '' }]
//       }
//     }));
//   };

//   const updateFormDataField = (index: number, field: Partial<FormDataField>) => {
//     setTestRequest(prev => ({
//       ...prev,
//       body: {
//         ...prev.body,
//         formData: prev.body.formData.map((item, i) => 
//           i === index ? { ...item, ...field } : item
//         )
//       }
//     }));
//   };

//   const removeFormDataField = (index: number) => {
//     setTestRequest(prev => ({
//       ...prev,
//       body: {
//         ...prev.body,
//         formData: prev.body.formData.filter((_, i) => i !== index)
//       }
//     }));
//   };

//   const handleFileSelect = (file: File | null, isFormData = false, formDataIndex?: number) => {
//     if (isFormData && formDataIndex !== undefined) {
//       updateFormDataField(formDataIndex, { file: file ?? undefined, value: file?.name || '' });
//     } else {
//       setTestRequest(prev => ({
//         ...prev,
//         body: { ...prev.body, binary: file || undefined }
//       }));
//     }
//   };

//   const formatRawContent = () => {
//     if (testRequest.body.raw.format === 'json') {
//       try {
//         const parsed = JSON.parse(testRequest.body.raw.content);
//         return JSON.stringify(parsed, null, 2);
//       } catch {
//         return testRequest.body.raw.content;
//       }
//     }
//     return testRequest.body.raw.content;
//   };

//   const copyToClipboard = (text: string) => {
//     if (navigator.clipboard) {
//       navigator.clipboard.writeText(text);
//     } else {
//       // fallback for older browsers
//       const textarea = document.createElement('textarea');
//       textarea.value = text;
//       document.body.appendChild(textarea);
//       textarea.select();
//       document.execCommand('copy');
//       document.body.removeChild(textarea);
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//       {/* Request Panel */}
//       <div className="space-y-6">
//         <h2 className="text-xl font-semibold text-white flex items-center">
//           <Play className="w-5 h-5 mr-2 text-blue-400" />
//           API Tester
//         </h2>
        
//         {/* Method and URL */}
//         <div className="flex space-x-3">
//           <select
//             value={testRequest.method}
//             onChange={(e) => setTestRequest(prev => ({ ...prev, method: e.target.value }))}
//             className="w-32 p-4 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
//           >
//             <option value="GET">GET</option>
//             <option value="POST">POST</option>
//             <option value="PUT">PUT</option>
//             <option value="DELETE">DELETE</option>
//             <option value="PATCH">PATCH</option>
//           </select>
//           <input
//             type="text"
//             value={testRequest.url}
//             onChange={(e) => setTestRequest(prev => ({ ...prev, url: e.target.value }))}
//             placeholder="https://yourwebsite.com/api/v1/endpoint"
//             className="flex-1 p-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
//           />
//           <button
//             onClick={handleTestAPI}
//             disabled={!testRequest.url || isLoading}
//             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium flex items-center transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
//           >
//             {isLoading ? (
//               <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//             ) : (
//               <Send className="w-5 h-5 mr-2" />
//             )}
//             Send
//           </button>
//         </div>

//         {/* Request Configuration Tabs */}
//         <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
//           <div className="flex border-b border-white/10">
//             {[
//               { key: 'params', label: 'Params', icon: Settings },
//               { key: 'auth', label: 'Auth', icon: Lock },
//               { key: 'headers', label: 'Headers', icon: FileText },
//               { key: 'body', label: 'Body', icon: Code }
//             ].map(({ key, label, icon: Icon }) => (
//               <button
//                 key={key}
//                 onClick={() => setActiveSection(key as any)}
//                 className={`flex-1 flex items-center justify-center space-x-2 py-4 px-4 text-sm font-medium transition-all ${
//                   activeSection === key
//                     ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-500'
//                     : 'text-gray-300 hover:text-white hover:bg-white/10'
//                 }`}
//               >
//                 <Icon className="w-4 h-4" />
//                 <span>{label}</span>
//               </button>
//             ))}
//           </div>

//           <div className="p-6">
//             {/* Params Section */}
//             {activeSection === 'params' && (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <h4 className="font-medium text-white">Query Parameters</h4>
//                   <button
//                     onClick={addParam}
//                     className="text-blue-400 hover:text-blue-300 text-sm flex items-center bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
//                   >
//                     <Plus className="w-4 h-4 mr-1" />
//                     Add Param
//                   </button>
//                 </div>
//                 {Object.entries(testRequest.params).length === 0 ? (
//                   <p className="text-gray-400 text-sm text-center py-8">No parameters added</p>
//                 ) : (
//                   <div className="space-y-3">
//                     {Object.entries(testRequest.params).map(([key, value]) => (
//                       <div key={key} className="flex space-x-3">
//                         <input
//                           type="text"
//                           value={key}
//                           onChange={(e) => updateParam(key, e.target.value, value)}
//                           placeholder="Parameter name"
//                           className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                         />
//                         <input
//                           type="text"
//                           value={value}
//                           onChange={(e) => updateParam(key, key, e.target.value)}
//                           placeholder="Parameter value"
//                           className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                         />
//                         <button
//                           onClick={() => removeParam(key)}
//                           className="text-red-400 hover:text-red-300 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Auth Section */}
//             {activeSection === 'auth' && (
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-3">
//                     Authentication Type
//                   </label>
//                   <select
//                     value={testRequest.auth.type}
//                     onChange={(e) => setTestRequest(prev => ({
//                       ...prev,
//                       auth: { ...prev.auth, type: e.target.value as any }
//                     }))}
//                     className="w-full p-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
//                   >
//                     <option value="none">No Auth</option>
//                     <option value="bearer">Bearer Token</option>
//                     <option value="basic">Basic Auth</option>
//                     <option value="api-key">API Key</option>
//                   </select>
//                 </div>

//                 {testRequest.auth.type === 'bearer' && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-300 mb-3">
//                       Bearer Token
//                     </label>
//                     <input
//                       type="text"
//                       value={testRequest.auth.token || ''}
//                       onChange={(e) => setTestRequest(prev => ({
//                         ...prev,
//                         auth: { ...prev.auth, token: e.target.value }
//                       }))}
//                       placeholder="Enter your bearer token"
//                       className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                     />
//                   </div>
//                 )}

//                 {testRequest.auth.type === 'basic' && (
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-300 mb-3">
//                         Username
//                       </label>
//                       <input
//                         type="text"
//                         value={testRequest.auth.username || ''}
//                         onChange={(e) => setTestRequest(prev => ({
//                           ...prev,
//                           auth: { ...prev.auth, username: e.target.value }
//                         }))}
//                         placeholder="Username"
//                         className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-300 mb-3">
//                         Password
//                       </label>
//                       <input
//                         type="password"
//                         value={testRequest.auth.password || ''}
//                         onChange={(e) => setTestRequest(prev => ({
//                           ...prev,
//                           auth: { ...prev.auth, password: e.target.value }
//                         }))}
//                         placeholder="Password"
//                         className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 {testRequest.auth.type === 'api-key' && (
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-300 mb-3">
//                         Header Name
//                       </label>
//                       <input
//                         type="text"
//                         value={testRequest.auth.apiKeyHeader || 'X-API-Key'}
//                         onChange={(e) => setTestRequest(prev => ({
//                           ...prev,
//                           auth: { ...prev.auth, apiKeyHeader: e.target.value }
//                         }))}
//                         placeholder="X-API-Key"
//                         className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-300 mb-3">
//                         API Key
//                       </label>
//                       <input
//                         type="text"
//                         value={testRequest.auth.apiKey || ''}
//                         onChange={(e) => setTestRequest(prev => ({
//                           ...prev,
//                           auth: { ...prev.auth, apiKey: e.target.value }
//                         }))}
//                         placeholder="Enter your API key"
//                         className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Headers Section */}
//             {activeSection === 'headers' && (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <h4 className="font-medium text-white">Headers</h4>
//                   <button
//                     onClick={addHeader}
//                     className="text-blue-400 hover:text-blue-300 text-sm flex items-center bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
//                   >
//                     <Plus className="w-4 h-4 mr-1" />
//                     Add Header
//                   </button>
//                 </div>
//                 <div className="space-y-3">
//                   {Object.entries(testRequest.headers).map(([key, value]) => (
//                     <div key={key} className="flex space-x-3">
//                       <input
//                         type="text"
//                         value={key}
//                         onChange={(e) => updateHeader(key, e.target.value, value)}
//                         placeholder="Header name"
//                         className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       />
//                       <input
//                         type="text"
//                         value={value}
//                         onChange={(e) => updateHeader(key, key, e.target.value)}
//                         placeholder="Header value"
//                         className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       />
//                       <button
//                         onClick={() => removeHeader(key)}
//                         className="text-red-400 hover:text-red-300 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Body Section */}
//             {activeSection === 'body' && (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <h4 className="font-medium text-white">Request Body</h4>
//                   <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
//                     {['none', 'formdata', 'raw', 'binary'].map((type) => (
//                       <button
//                         key={type}
//                         onClick={() => setTestRequest(prev => ({
//                           ...prev,
//                           body: { ...prev.body, type: type as any }
//                         }))}
//                         className={`px-3 py-1 text-xs font-medium rounded transition-all capitalize ${
//                           testRequest.body.type === type
//                             ? 'bg-blue-500 text-white'
//                             : 'text-gray-400 hover:text-white hover:bg-white/10'
//                         }`}
//                       >
//                         {type}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {testRequest.body.type === 'none' && (
//                   <div className="text-center py-8 text-gray-400">
//                     No body content
//                   </div>
//                 )}

//                 {testRequest.body.type === 'formdata' && (
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm text-gray-300">Form Data Fields</span>
//                       <button
//                         onClick={addFormDataField}
//                         className="text-blue-400 hover:text-blue-300 text-sm flex items-center bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
//                       >
//                         <Plus className="w-4 h-4 mr-1" />
//                         Add Field
//                       </button>
//                     </div>
                    
//                     {testRequest.body.formData.length === 0 ? (
//                       <p className="text-gray-400 text-sm text-center py-8">No form fields added</p>
//                     ) : (
//                       <div className="space-y-3">
//                         {testRequest.body.formData.map((field, index) => (
//                           <div key={index} className="flex space-x-3 items-center">
//                             <input
//                               type="text"
//                               value={field.key}
//                               onChange={(e) => updateFormDataField(index, { key: e.target.value })}
//                               placeholder="Field name"
//                               className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                             />
//                             <select
//                               value={field.type}
//                               onChange={(e) => updateFormDataField(index, { 
//                                 type: e.target.value as 'text' | 'file',
//                                 value: e.target.value === 'file' ? '' : field.value,
//                                 file: e.target.value === 'file' ? undefined : field.file
//                               })}
//                               className="w-20 p-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                             >
//                               <option value="text">Text</option>
//                               <option value="file">File</option>
//                             </select>
                            
//                             {field.type === 'text' ? (
//                               <input
//                                 type="text"
//                                 value={field.value}
//                                 onChange={(e) => updateFormDataField(index, { value: e.target.value })}
//                                 placeholder="Field value"
//                                 className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                               />
//                             ) : (
//                               <div className="flex-1 flex items-center space-x-2">
//                                 <input
//                                   type="file"
//                                   onChange={(e) => handleFileSelect(e.target.files?.[0] || null, true, index)}
//                                   className="hidden"
//                                   id={`formdata-file-${index}`}
//                                 />
//                                 <label
//                                   htmlFor={`formdata-file-${index}`}
//                                   className="flex-1 p-3 bg-white/10 border border-white/20 text-gray-400 rounded-lg cursor-pointer hover:bg-white/20 transition-colors flex items-center"
//                                 >
//                                   <Upload className="w-4 h-4 mr-2" />
//                                   {field.file?.name || 'Choose file...'}
//                                 </label>
//                               </div>
//                             )}
                            
//                             <button
//                               onClick={() => removeFormDataField(index)}
//                               className="text-red-400 hover:text-red-300 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {testRequest.body.type === 'raw' && (
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm text-gray-300">Content Type</span>
//                       <select
//                         value={testRequest.body.raw.format}
//                         onChange={(e) => setTestRequest(prev => ({
//                           ...prev,
//                           body: {
//                             ...prev.body,
//                             raw: { ...prev.body.raw, format: e.target.value as any }
//                           }
//                         }))}
//                         className="w-32 p-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                       >
//                         <option value="json">JSON</option>
//                         <option value="text">Text</option>
//                         <option value="xml">XML</option>
//                         <option value="html">HTML</option>
//                       </select>
//                     </div>
                    
//                     <textarea
//                       value={testRequest.body.raw.content}
//                       onChange={(e) => setTestRequest(prev => ({
//                         ...prev,
//                         body: {
//                           ...prev.body,
//                           raw: { ...prev.body.raw, content: e.target.value }
//                         }
//                       }))}
//                       placeholder={testRequest.body.raw.format === 'json' 
//                         ? '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
//                         : 'Enter your raw content here...'
//                       }
//                       className="w-full h-40 p-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm resize-none"
//                     />
                    
//                     <div className="flex justify-between items-center">
//                       <p className="text-xs text-gray-400">
//                         Format: {testRequest.body.raw.format.toUpperCase()}
//                       </p>
//                       {testRequest.body.raw.format === 'json' && (
//                         <button
//                           onClick={() => {
//                             try {
//                               const formatted = JSON.stringify(JSON.parse(testRequest.body.raw.content), null, 2);
//                               setTestRequest(prev => ({
//                                 ...prev,
//                                 body: {
//                                   ...prev.body,
//                                   raw: { ...prev.body.raw, content: formatted }
//                                 }
//                               }));
//                             } catch (e) {
//                               // Invalid JSON, do nothing
//                             }
//                           }}
//                           className="text-blue-400 hover:text-blue-300 text-xs bg-blue-500/20 hover:bg-blue-500/30 px-2 py-1 rounded transition-colors"
//                         >
//                           Format JSON
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {testRequest.body.type === 'binary' && (
//                   <div className="space-y-4">
//                     <div className="text-center">
//                       <input
//                         type="file"
//                         onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
//                         className="hidden"
//                         id="binary-file-input"
//                         ref={fileInputRef}
//                       />
//                       <label
//                         htmlFor="binary-file-input"
//                         className="inline-flex items-center justify-center w-full p-8 bg-white/10 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
//                       >
//                         <div className="text-center">
//                           <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                           <p className="text-gray-300 mb-1">
//                             {testRequest.body.binary?.name || 'Click to select a file'}
//                           </p>
//                           <p className="text-xs text-gray-400">
//                             Any file type supported
//                           </p>
//                         </div>
//                       </label>
//                     </div>
                    
//                     {testRequest.body.binary && (
//                       <div className="bg-white/10 border border-white/20 rounded-xl p-4">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-3">
//                             <FileText className="w-5 h-5 text-blue-400" />
//                             <div>
//                               <p className="text-white font-medium">{testRequest.body.binary.name}</p>
//                               <p className="text-xs text-gray-400">
//                                 {(testRequest.body.binary.size / 1024).toFixed(1)} KB
//                               </p>
//                             </div>
//                           </div>
//                           <button
//                             onClick={() => setTestRequest(prev => ({
//                               ...prev,
//                               body: { ...prev.body, binary: undefined }
//                             }))}
//                             className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-colors"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Response Panel */}
//       <div>
//         <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
//           <Activity className="w-5 h-5 mr-2 text-green-400" />
//           Response
//         </h2>
        
//         {testResponse ? (
//           <div className="space-y-6">
//             {/* Status Bar */}
//             <div className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
//               <div className="flex items-center space-x-6">
//                 <div className="flex items-center space-x-2">
//                   <span className="text-sm font-medium text-gray-300">Status:</span>
//                   <span className={`font-bold text-lg ${getStatusColor(testResponse.status)}`}>
//                     {testResponse.status} {testResponse.statusText}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <span className="text-sm font-medium text-gray-300">Time:</span>
//                   <span className="text-sm text-blue-300 font-mono font-medium">{testResponse.responseTime}ms</span>
//                 </div>
//               </div>
//               <button
//                 onClick={() => copyToClipboard(JSON.stringify(testResponse.data, null, 2))}
//                 className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
//               >
//                 <Copy className="w-4 h-4" />
//               </button>
//             </div>

//             {/* Response Tabs */}
//             <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
//               <div className="flex border-b border-white/10">
//                 <button 
//                   onClick={() => setActiveResponseTab('body')}
//                   className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
//                     activeResponseTab === 'body'
//                       ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-500'
//                       : 'text-gray-300 hover:text-white hover:bg-white/10'
//                   }`}
//                 >
//                   Body
//                 </button>
//                 <button 
//                   onClick={() => setActiveResponseTab('headers')}
//                   className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
//                     activeResponseTab === 'headers'
//                       ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-500'
//                       : 'text-gray-300 hover:text-white hover:bg-white/10'
//                   }`}
//                 >
//                   Headers ({Object.keys(testResponse.headers).length})
//                 </button>
//               </div>

//               <div className="p-6">
//                 {activeResponseTab === 'body' && (
//                   <div className="bg-gray-900/50 border border-white/10 p-6 rounded-xl text-green-400 font-mono text-sm overflow-auto max-h-96">
//                     <pre>{typeof testResponse.data === 'string' ? testResponse.data : JSON.stringify(testResponse.data, null, 2)}</pre>
//                   </div>
//                 )}

//                 {activeResponseTab === 'headers' && (
//                   <div className="space-y-2">
//                     {Object.entries(testResponse.headers).map(([key, value]) => (
//                       <div key={key} className="flex py-2 text-sm font-mono bg-white/5 rounded-lg px-3">
//                         <span className="text-blue-400 mr-3 w-1/3 font-semibold">{key}:</span>
//                         <span className="text-gray-300 flex-1">{value}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
//             <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
//               <Send className="w-8 h-8 text-white" />
//             </div>
//             <p className="text-gray-300 text-lg mb-2">Send a request to see the response</p>
//             <p className="text-gray-400 text-sm">Configure your request and hit Send</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default APITester;

import React, { useState, useRef } from 'react';
import { 
  Play, 
  Copy, 
  Send, 
  Settings, 
  Lock, 
  FileText, 
  Code, 
  Upload, 
  Loader2, 
  Activity, 
  Trash2, 
  Plus 
} from 'lucide-react';

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

interface APITesterProps {
  testRequest: TestRequest;
  setTestRequest: React.Dispatch<React.SetStateAction<TestRequest>>;
  testResponse: TestResponse | null;
  setTestResponse: React.Dispatch<React.SetStateAction<TestResponse | null>>;
  getStatusColor: (status: number) => string;
}

const APITester: React.FC<APITesterProps> = ({
  testRequest,
  setTestRequest,
  testResponse,
  setTestResponse,
  getStatusColor
}) => {
  const [activeSection, setActiveSection] = useState<'params' | 'auth' | 'headers' | 'body'>('params');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTestAPI = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const headers = { ...testRequest.headers };
      if (testRequest.auth.type === 'bearer' && testRequest.auth.token) {
        headers['Authorization'] = `Bearer ${testRequest.auth.token}`;
      } else if (testRequest.auth.type === 'basic' && testRequest.auth.username && testRequest.auth.password) {
        headers['Authorization'] = `Basic ${btoa(`${testRequest.auth.username}:${testRequest.auth.password}`)}`;
      } else if (testRequest.auth.type === 'api-key' && testRequest.auth.apiKey && testRequest.auth.apiKeyHeader) {
        headers[testRequest.auth.apiKeyHeader] = testRequest.auth.apiKey;
      }

      let body: BodyInit | undefined;
      if (testRequest.body.type === 'raw' && testRequest.body.raw.content) {
        body = testRequest.body.raw.content;
      } else if (testRequest.body.type === 'formdata' && testRequest.body.formData.length > 0) {
        const formData = new FormData();
        testRequest.body.formData.forEach(field => {
          if (field.type === 'text') {
            formData.append(field.key, field.value);
          } else if (field.file) {
            formData.append(field.key, field.file);
          }
        });
        body = formData;
      } else if (testRequest.body.type === 'binary' && testRequest.body.binary) {
        body = testRequest.body.binary;
      }

      const url = new URL(testRequest.url);
      Object.entries(testRequest.params).forEach(([key, value]) => {
        if (key && value) url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        method: testRequest.method,
        headers,
        body: testRequest.body.type !== 'none' ? body : undefined
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      setTestResponse({
        status: 500,
        statusText: 'Error',
        headers: {},
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        responseTime: Date.now() - startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

    const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const addParam = () => {
    setTestRequest(prev => ({
      ...prev,
      params: { ...prev.params, '': '' }
    }));
  };

  const updateParam = (oldKey: string, newKey: string, value: string) => {
    setTestRequest(prev => {
      const newParams = { ...prev.params };
      if (oldKey !== newKey) {
        delete newParams[oldKey];
      }
      newParams[newKey] = value;
      return { ...prev, params: newParams };
    });
  };

  const removeParam = (key: string) => {
    setTestRequest(prev => {
      const newParams = { ...prev.params };
      delete newParams[key];
      return { ...prev, params: newParams };
    });
  };

  const addHeader = () => {
    setTestRequest(prev => ({
      ...prev,
      headers: { ...prev.headers, '': '' }
    }));
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    setTestRequest(prev => {
      const newHeaders = { ...prev.headers };
      if (oldKey !== newKey) {
        delete newHeaders[oldKey];
      }
      newHeaders[newKey] = value;
      return { ...prev, headers: newHeaders };
    });
  };

  const removeHeader = (key: string) => {
    setTestRequest(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const addFormDataField = () => {
    setTestRequest(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: [...prev.body.formData, { key: '', type: 'text', value: '' }]
      }
    }));
  };

  const updateFormDataField = (index: number, field: Partial<FormDataField>) => {
    setTestRequest(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body.formData.map((item, i) => 
          i === index ? { ...item, ...field } : item
        )
      }
    }));
  };

  const removeFormDataField = (index: number) => {
    setTestRequest(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body.formData.filter((_, i) => i !== index)
      }
    }));
  };

  const handleFileSelect = (file: File | null, isFormData = false, formDataIndex?: number) => {
    if (isFormData && formDataIndex !== undefined) {
      updateFormDataField(formDataIndex, { file: file ?? undefined, value: file?.name || '' });
    } else {
      setTestRequest(prev => ({
        ...prev,
        body: { ...prev.body, binary: file || undefined }
      }));
    }
  };

  const formatRawContent = () => {
    if (testRequest.body.raw.format === 'json') {
      try {
        const parsed = JSON.parse(testRequest.body.raw.content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return testRequest.body.raw.content;
      }
    }
    return testRequest.body.raw.content;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Play className="w-5 h-5 mr-2 text-blue-400" />
          API Tester
        </h2>
        <div className="flex space-x-3">
          <select
            value={testRequest.method}
            onChange={(e) => setTestRequest(prev => ({ ...prev, method: e.target.value }))}
            className="w-32 p-4 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <input
            type="text"
            value={testRequest.url}
            onChange={(e) => setTestRequest(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://yourwebsite.com/api/v1/endpoint"
            className="flex-1 p-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
          />
          <button
            onClick={handleTestAPI}
            disabled={!testRequest.url || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium flex items-center transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Send
          </button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex border-b border-white/10">
            {[
              { key: 'params', label: 'Params', icon: Settings },
              { key: 'auth', label: 'Auth', icon: Lock },
              { key: 'headers', label: 'Headers', icon: FileText },
              { key: 'body', label: 'Body', icon: Code }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-4 text-sm font-medium transition-all ${
                  activeSection === key
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-500'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeSection === 'params' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Query Parameters</h4>
                  <button
                    onClick={addParam}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Param
                  </button>
                </div>
                {Object.entries(testRequest.params).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No parameters added</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(testRequest.params).map(([key, value]) => (
                      <div key={key} className="flex space-x-3">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => updateParam(key, e.target.value, value)}
                          placeholder="Parameter name"
                          className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateParam(key, key, e.target.value)}
                          placeholder="Parameter value"
                          className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                          onClick={() => removeParam(key)}
                          className="text-red-400 hover:text-red-300 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeSection === 'auth' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Authentication Type
                  </label>
                  <select
                    value={testRequest.auth.type}
                    onChange={(e) => setTestRequest(prev => ({
                      ...prev,
                      auth: { ...prev.auth, type: e.target.value as any }
                    }))}
                    className="w-full p-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                  >
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>
                {testRequest.auth.type === 'bearer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Bearer Token
                    </label>
                    <input
                      type="text"
                      value={testRequest.auth.token || ''}
                      onChange={(e) => setTestRequest(prev => ({
                        ...prev,
                        auth: { ...prev.auth, token: e.target.value }
                      }))}
                      placeholder="Enter your bearer token"
                      className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                )}
                {testRequest.auth.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Username
                      </label>
                      <input
                        type="text"
                        value={testRequest.auth.username || ''}
                        onChange={(e) => setTestRequest(prev => ({
                          ...prev,
                          auth: { ...prev.auth, username: e.target.value }
                        }))}
                        placeholder="Username"
                        className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Password
                      </label>
                      <input
                        type="password"
                        value={testRequest.auth.password || ''}
                        onChange={(e) => setTestRequest(prev => ({
                          ...prev,
                          auth: { ...prev.auth, password: e.target.value }
                        }))}
                        placeholder="Password"
                        className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                )}
                {testRequest.auth.type === 'api-key' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Header Name
                      </label>
                      <input
                        type="text"
                        value={testRequest.auth.apiKeyHeader || 'X-API-Key'}
                        onChange={(e) => setTestRequest(prev => ({
                          ...prev,
                          auth: { ...prev.auth, apiKeyHeader: e.target.value }
                        }))}
                        placeholder="X-API-Key"
                        className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        API Key
                      </label>
                      <input
                        type="text"
                        value={testRequest.auth.apiKey || ''}
                        onChange={(e) => setTestRequest(prev => ({
                          ...prev,
                          auth: { ...prev.auth, apiKey: e.target.value }
                        }))}
                        placeholder="Enter your API key"
                        className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeSection === 'headers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Headers</h4>
                  <button
                    onClick={addHeader}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Header
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(testRequest.headers).map(([key, value]) => (
                    <div key={key} className="flex space-x-3">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => updateHeader(key, e.target.value, value)}
                        placeholder="Header name"
                        className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateHeader(key, key, e.target.value)}
                        placeholder="Header value"
                        className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <button
                        onClick={() => removeHeader(key)}
                        className="text-red-400 hover:text-red-300 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === 'body' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Request Body</h4>
                  <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
                    {['none', 'formdata', 'raw', 'binary'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setTestRequest(prev => ({
                          ...prev,
                          body: { ...prev.body, type: type as any }
                        }))}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all capitalize ${
                          testRequest.body.type === type
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                {testRequest.body.type === 'none' && (
                  <div className="text-center py-8 text-gray-400">
                    No body content
                  </div>
                )}
                {testRequest.body.type === 'formdata' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Form Data Fields</span>
                      <button
                        onClick={addFormDataField}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Field
                      </button>
                    </div>
                    {testRequest.body.formData.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">No form fields added</p>
                    ) : (
                      <div className="space-y-3">
                        {testRequest.body.formData.map((field, index) => (
                          <div key={index} className="flex space-x-3 items-center">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => updateFormDataField(index, { key: e.target.value })}
                              placeholder="Field name"
                              className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <select
                              value={field.type}
                              onChange={(e) => updateFormDataField(index, { 
                                type: e.target.value as 'text' | 'file',
                                value: e.target.value === 'file' ? '' : field.value,
                                file: e.target.value === 'file' ? undefined : field.file
                              })}
                              className="w-20 p-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                              <option value="text">Text</option>
                              <option value="file">File</option>
                            </select>
                            {field.type === 'text' ? (
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => updateFormDataField(index, { value: e.target.value })}
                                placeholder="Field value"
                                className="flex-1 p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                            ) : (
                              <div className="flex-1 flex items-center space-x-2">
                                <input
                                  type="file"
                                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null, true, index)}
                                  className="hidden"
                                  id={`formdata-file-${index}`}
                                />
                                <label
                                  htmlFor={`formdata-file-${index}`}
                                  className="flex-1 p-3 bg-white/10 border border-white/20 text-gray-400 rounded-lg cursor-pointer hover:bg-white/20 transition-colors flex items-center"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {field.file?.name || 'Choose file...'}
                                </label>
                              </div>
                            )}
                            <button
                              onClick={() => removeFormDataField(index)}
                              className="text-red-400 hover:text-red-300 p-3 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {testRequest.body.type === 'raw' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Content Type</span>
                      <select
                        value={testRequest.body.raw.format}
                        onChange={(e) => setTestRequest(prev => ({
                          ...prev,
                          body: {
                            ...prev.body,
                            raw: { ...prev.body.raw, format: e.target.value as any }
                          }
                        }))}
                        className="w-32 p-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="json">JSON</option>
                        <option value="text">Text</option>
                        <option value="xml">XML</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                    <textarea
                      value={testRequest.body.raw.content}
                      onChange={(e) => setTestRequest(prev => ({
                        ...prev,
                        body: {
                          ...prev.body,
                          raw: { ...prev.body.raw, content: e.target.value }
                        }
                      }))}
                      placeholder={testRequest.body.raw.format === 'json' 
                        ? '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                        : 'Enter your raw content here...'
                      }
                      className="w-full h-40 p-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        Format: {testRequest.body.raw.format.toUpperCase()}
                      </p>
                      {testRequest.body.raw.format === 'json' && (
                        <button
                          onClick={() => {
                            try {
                              const formatted = JSON.stringify(JSON.parse(testRequest.body.raw.content), null, 2);
                              setTestRequest(prev => ({
                                ...prev,
                                body: {
                                  ...prev.body,
                                  raw: { ...prev.body.raw, content: formatted }
                                }
                              }));
                            } catch (e) {
                              // Invalid JSON, do nothing
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs bg-blue-500/20 hover:bg-blue-500/30 px-2 py-1 rounded transition-colors"
                        >
                          Format JSON
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {testRequest.body.type === 'binary' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <input
                        type="file"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                        id="binary-file-input"
                        ref={fileInputRef}
                      />
                      <label
                        htmlFor="binary-file-input"
                        className="inline-flex items-center justify-center w-full p-8 bg-white/10 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-300 mb-1">
                            {testRequest.body.binary?.name || 'Click to select a file'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Any file type supported
                          </p>
                        </div>
                      </label>
                    </div>
                    {testRequest.body.binary && (
                      <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{testRequest.body.binary.name}</p>
                              <p className="text-xs text-gray-400">
                                {(testRequest.body.binary.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setTestRequest(prev => ({
                              ...prev,
                              body: { ...prev.body, binary: undefined }
                            }))}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-green-400" />
          Response
        </h2>
        {testResponse ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-300">Status:</span>
                  <span className={`font-bold text-lg ${getStatusColor(testResponse.status)}`}>
                    {testResponse.status} {testResponse.statusText}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-300">Time:</span>
                  <span className="text-sm text-blue-300 font-mono font-medium">{testResponse.responseTime}ms</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(testResponse.data, null, 2))}
                className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveResponseTab('body')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
                    activeResponseTab === 'body'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Body
                </button>
                <button 
                  onClick={() => setActiveResponseTab('headers')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-all ${
                    activeResponseTab === 'headers'
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Headers ({Object.keys(testResponse.headers).length})
                </button>
              </div>
              <div className="p-6">
                {activeResponseTab === 'body' && (
                  <div className="bg-gray-900/50 border border-white/10 p-6 rounded-xl text-green-400 font-mono text-sm overflow-auto max-h-96">
                    <pre>{typeof testResponse.data === 'string' ? testResponse.data : JSON.stringify(testResponse.data, null, 2)}</pre>
                  </div>
                )}
                {activeResponseTab === 'headers' && (
                  <div className="space-y-2">
                    {Object.entries(testResponse.headers).map(([key, value]) => (
                      <div key={key} className="flex py-2 text-sm font-mono bg-white/5 rounded-lg px-3">
                        <span className="text-blue-400 mr-3 w-1/3 font-semibold">{key}:</span>
                        <span className="text-gray-300 flex-1">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-300 text-lg mb-2">Send a request to see the response</p>
            <p className="text-gray-400 text-sm">Configure your request and hit Send</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default APITester;