import React, { useState, useEffect } from 'react';
import { Database, Plus, Grid, List, Eye, Users, Table, Activity, Clock, CheckCircle, XCircle, Zap, Server } from 'lucide-react';
import { addDatabase, getDatabases } from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

interface DatabaseConnection {
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

interface AddDatabaseForm {
    name: string;
    type: 'MySQL' | 'PostgreSQL' | 'SQLite';
    host: string;
    port: string;
    username: string;
    password: string;
    database_name: string;
}

const Dashboard = () => {
    const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const user = getCurrentUser();
    const [userId, setUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState<AddDatabaseForm>({
        name: '',
        type: 'PostgreSQL',
        host: '',
        port: '',
        username: '',
        password: '',
        database_name: ''
    });
  const navigate = useNavigate();

    useEffect(() => {
        const fetchDatabases = async () => {
            try {
                if (userId) {
                    console.log(`Fetching databases for user ID: ${userId}`);
                    const data = await getDatabases(userId);
                    setDatabases(data);
                }
            } catch (err) {
                setError('Failed to fetch databases');
            }
        };
        if (user?.id) {
            setUserId(user.id);
            fetchDatabases();
        }
    }, [userId]);

    const handleAddDatabase = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);
        setError(null);

        try {
            const newDatabase = await addDatabase({
                ...formData,
                port: parseInt(formData.port) || 5432,
                user_id: userId ?? '',
                database_name: formData.database_name
            });

            setDatabases([...databases, newDatabase]);
            setShowAddModal(false);
            setFormData({
                name: '',
                type: 'PostgreSQL',
                host: '',
                port: '',
                username: '',
                password: '',
                database_name: ''
            });
        } catch (err) {
            setError('Failed to add database');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDatabaseClick = (db: DatabaseConnection) => {
        navigate(`/database/${db.id}`);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'disconnected':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'connecting':
                return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
            default:
                return <XCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'PostgreSQL':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'MySQL':
                return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            case 'SQLite':
                return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PostgreSQL':
                return <Database className="w-5 h-5 text-blue-400" />;
            case 'MySQL':
                return <Server className="w-5 h-5 text-orange-400" />;
            case 'SQLite':
                return <Zap className="w-5 h-5 text-gray-400" />;
            default:
                return <Database className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="relative bg-white/5 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Database Manager</h1>
                                <p className="text-gray-400 text-sm">Manage and explore your databases</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        viewMode === 'grid' 
                                            ? 'bg-white/20 text-white shadow-lg transform scale-105' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        viewMode === 'list' 
                                            ? 'bg-white/20 text-white shadow-lg transform scale-105' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105 font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Database</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                        {error}
                    </div>
                )}
                {databases.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Database className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No databases connected</h3>
                        <p className="text-gray-400">Get started by adding your first database connection.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {databases.map((db) => (
                            <div
                                key={db.id}
                                onClick={() => handleDatabaseClick(db)}
                                className={`bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-200 ${
                                    db.status === 'connected' 
                                        ? 'cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transform hover:scale-[1.02]' 
                                        : 'cursor-not-allowed opacity-60'
                                } ${viewMode === 'list' ? 'flex items-center p-6' : 'p-6'}`}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/20">
                                                    {getTypeIcon(db.type)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white text-lg">{db.name}</h3>
                                                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(db.type)}`}>
                                                        {db.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(db.status)}
                                                {db.status === 'connected' && (
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Server className="w-4 h-4 text-gray-400 mr-2" />
                                                <span className="font-medium">Host:</span>
                                                <span className="ml-2 text-gray-400">{db.host}:{db.port}</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                    <div className="flex items-center text-sm">
                                                        <Table className="w-4 h-4 text-blue-400 mr-2" />
                                                        <span className="text-gray-300">{db.table_count} tables</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                    <div className="flex items-center text-sm">
                                                        <Users className="w-4 h-4 text-purple-400 mr-2" />
                                                        <span className="text-gray-300">{db.total_rows.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center text-sm text-gray-400 bg-white/5 rounded-lg p-3 border border-white/10">
                                                <Clock className="w-4 h-4 mr-2" />
                                                <span>Last connected: {db.last_connected}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-6 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/20">
                                                {getTypeIcon(db.type)}
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-semibold text-white text-lg">{db.name}</h3>
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(db.type)}`}>
                                                        {db.type}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                        {getStatusIcon(db.status)}
                                                        {db.status === 'connected' && (
                                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-400">{db.host}:{db.port}</p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-8 text-sm text-gray-300">
                                                <div className="flex items-center bg-white/5 px-3 py-2 rounded-lg">
                                                    <Table className="w-4 h-4 mr-2 text-blue-400" />
                                                    <span>{db.table_count}</span>
                                                </div>
                                                <div className="flex items-center bg-white/5 px-3 py-2 rounded-lg">
                                                    <Users className="w-4 h-4 mr-2 text-purple-400" />
                                                    <span>{db.total_rows.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center bg-white/5 px-3 py-2 rounded-lg">
                                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span>{db.last_connected}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="ml-6">
                                            <Eye className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Database Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-md w-full p-8">
                        <h2 className="text-2xl font-semibold text-white mb-6">Add New Database</h2>
                        
                        {error && (
                            <div className="mb-4 p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Database Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="My Database"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Database Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                    className="w-full px)\
                                    py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="PostgreSQL" className="bg-gray-800 text-white">PostgreSQL</option>
                                    <option value="MySQL" className="bg-gray-800 text-white">MySQL</option>
                                    <option value="SQLite" className="bg-gray-800 text-white">SQLite</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Host
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.host}
                                        onChange={(e) => setFormData({...formData, host: e.target.value})}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="localhost"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Port
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.port}
                                        onChange={(e) => setFormData({...formData, port: e.target.value})}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="5432"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Database Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.database_name}
                                    onChange={(e) => setFormData({...formData, database_name: e.target.value})}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="database_name"
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-3 text-gray-300 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 font-medium border border-white/20"
                                    disabled={isConnecting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddDatabase}
                                    disabled={isConnecting}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 font-medium hover:shadow-lg transform hover:scale-105"
                                >
                                    {isConnecting ? (
                                        <>
                                            <Activity className="w-4 h-4 animate-spin" />
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            <span>Add Database</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Elements */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/5 rounded-full blur-lg"></div>
        </div>
    );
};

export default Dashboard;