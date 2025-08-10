import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Database, 
  Table, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  ArrowLeft,
  Layers,
  GitBranch,
  Key,
  Hash,
  Type,
  Calendar,
  MoreVertical,
  ChevronLeft,
  X,
  Share2,
  ZoomIn,
  ZoomOut,
  Move,
  Grid,
  Users,
  Activity
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatabaseDetails, getTableData } from '../utils/api';

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

interface TableRow {
  [key: string]: any;
}

interface TablePosition {
  x: number;
  y: number;
}

const DatabaseViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dbStructure, setDbStructure] = useState<Schema[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'er-diagram' | 'tables'>('overview');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tablePositions, setTablePositions] = useState<{[key: string]: TablePosition}>({});
  const [zoom, setZoom] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const itemsPerPage = 10;

  // Fetch database structure
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No database ID provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getDatabaseDetails(id);
        setDbStructure(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch database details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const currentSchema = dbStructure[0] || { name: 'public', tables: [] };

  // Initialize table positions
  useEffect(() => {
    if (Object.keys(tablePositions).length === 0 && currentSchema.tables.length > 0) {
      const positions: {[key: string]: TablePosition} = {};
      const tables = currentSchema.tables;
      
      // Create a circular layout
      const centerX = 400;
      const centerY = 300;
      const radius = 200;
      
      tables.forEach((table, index) => {
        const angle = (index / tables.length) * 2 * Math.PI;
        positions[table.name] = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        };
      });
      
      setTablePositions(positions);
    }
  }, [currentSchema.tables, tablePositions]);

  const fetchTableData = async (dbId: string, tableName: string) => {
    try {
        const data = await getTableData(dbId, tableName);
        return data;
    } catch (err) {
        console.error(`Failed to fetch data for table ${tableName}:`, err);
        return [];
    }
};

  const handleTableClick = async (tableName: string) => {
    setSelectedTable(tableName);
    setActiveTab('tables');
    const table = currentSchema.tables.find(t => t.name === tableName);
    if (table && id) {
        const data = await fetchTableData(id, tableName);
        setTableData(data);
    }
    setCurrentPage(1);
};

  const getColumnIcon = (column: Column) => {
    if (column.isPrimaryKey) return <Key className="w-4 h-4 text-yellow-400" />;
    if (column.isForeignKey) return <GitBranch className="w-4 h-4 text-blue-400" />;
    if (column.type.includes('timestamp') || column.type.includes('date')) return <Calendar className="w-4 h-4 text-green-400" />;
    if (column.type.includes('int') || column.type.includes('serial')) return <Hash className="w-4 h-4 text-purple-400" />;
    return <Type className="w-4 h-4 text-gray-400" />;
  };

  // Handle table dragging
  const handleTableMouseDown = (tableName: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedTable(tableName);
    setIsDragging(true);
    const rect = (e.target as Element).closest('.table-node')?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && draggedTable && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const newX = (e.clientX - rect.left - dragOffset.x) / zoom;
      const newY = (e.clientY - rect.top - dragOffset.y) / zoom;
      
      setTablePositions(prev => ({
        ...prev,
        [draggedTable]: { x: newX, y: newY }
      }));
    }
  }, [isDragging, draggedTable, dragOffset, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedTable(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const ERDiagram = () => {
    const connections: {
      from: { table: string; column: string; pos: TablePosition };
      to: { table: string; column: string; pos: TablePosition };
    }[] = [];
    currentSchema.tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.isForeignKey && column.foreignKeyTable && tablePositions[table.name] && tablePositions[column.foreignKeyTable]) {
          connections.push({
            from: { table: table.name, column: column.name, pos: tablePositions[table.name] },
            to: { table: column.foreignKeyTable, column: column.foreignKeyColumn || 'id', pos: tablePositions[column.foreignKeyTable] }
          });
        }
      });
    });

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900/5 to-purple-900/5 overflow-hidden rounded-xl border border-white/20" style={{ minHeight: '600px' }}>
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="p-2 hover:bg-white/20 rounded-md transition-colors text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-white font-medium px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.2))}
            className="p-2 hover:bg-white/20 rounded-md transition-colors text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 hover:bg-white/20 rounded-md transition-colors text-white"
          >
            <Move className="w-4 h-4" />
          </button>
        </div>

        <svg 
          ref={svgRef}
          className="w-full h-full" 
          style={{ 
            minWidth: '1200px', 
            minHeight: '800px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#60A5FA"
              />
            </marker>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />

          {connections.map((conn, index) => {
            const fromX = conn.from.pos.x + 150;
            const fromY = conn.from.pos.y + 40;
            const toX = conn.to.pos.x + 150;
            const toY = conn.to.pos.y + 40;
            
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const controlX1 = fromX + (midX - fromX) * 0.5;
            const controlY1 = fromY;
            const controlX2 = toX - (toX - midX) * 0.5;
            const controlY2 = toY;
            
            return (
              <g key={index}>
                <path
                  d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`}
                  stroke="#60A5FA"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="drop-shadow-sm"
                />
                <text
                  x={midX}
                  y={midY - 8}
                  className="fill-blue-400 text-xs font-medium"
                  textAnchor="middle"
                >
                  {conn.from.column}
                </text>
              </g>
            );
          })}
        </svg>

        {currentSchema.tables.map((table) => (
          <div
            key={table.name}
            className="table-node absolute bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl cursor-move hover:bg-white/15 transition-all duration-200"
            style={{
              left: tablePositions[table.name]?.x || 0,
              top: tablePositions[table.name]?.y || 0,
              width: '300px',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
            onMouseDown={(e) => handleTableMouseDown(table.name, e)}
          >
            <div className="bg-gradient-to-r from-blue-500/80 to-purple-600/80 text-white px-4 py-3 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Table className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{table.name}</span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  {table.rowCount.toLocaleString()}
                </span>
              </div>
              {table.description && (
                <p className="text-xs text-white/80 mt-1">{table.description}</p>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {table.columns.map((column, index) => (
                <div
                  key={column.name}
                  className={`px-4 py-2 border-b border-white/10 flex items-center justify-between text-sm ${
                    index % 2 === 0 ? 'bg-white/5' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getColumnIcon(column)}
                    <span className={`font-medium ${
                      column.isPrimaryKey ? 'text-yellow-300' : 
                      column.isForeignKey ? 'text-blue-300' : 'text-white'
                    }`}>
                      {column.name}
                    </span>
                    {!column.nullable && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 font-mono">
                    {column.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const filteredTableData = tableData.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedData = filteredTableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const currentTable = selectedTable ? currentSchema.tables.find(t => t.name === selectedTable) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <Activity className="w-6 h-6 mr-2 animate-spin" />
          Loading database details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 p-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">Database</h1>
                  <span className="text-sm text-gray-400">{currentSchema.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
              onClick={() => navigate(`/database/shell/${id}`)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg">
                      QueryShell
              </button>
              <button 
              onClick={() => navigate(`/database/api/${id}`)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg">
                      API Generator
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex space-x-1 pb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-white shadow-lg border border-white/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid className="w-4 h-4 mr-2 inline" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('er-diagram')}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'er-diagram'
                  ? 'bg-white/20 text-white shadow-lg border border-white/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Share2 className="w-4 h-4 mr-2 inline" />
              ER Diagram
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'tables'
                  ? 'bg-white/20 text-white shadow-lg border border-white/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Table className="w-4 h-4 mr-2 inline" />
              Tables
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Database Overview</h2>
              <p className="text-gray-400">Explore your database structure and relationships</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Table className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">{currentSchema.tables.length}</p>
                    <p className="text-sm text-gray-400">Tables</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">
                      {currentSchema.tables.reduce((acc, table) => acc + table.rowCount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">Total Rows</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">
                      {currentSchema.tables.reduce((acc, table) => 
                        acc + table.columns.filter(col => col.isForeignKey).length, 0
                      )}
                    </p>
                    <p className="text-sm text-gray-400">Relationships</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">Active</p>
                    <p className="text-sm text-gray-400">Status</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentSchema.tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => handleTableClick(table.name)}
                  className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 text-left hover:bg-white/15 hover:border-white/30 transition-all duration-200 hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/20">
                        <Table className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{table.name}</h3>
                        <p className="text-sm text-gray-400">{table.columns.length} columns</p>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  
                  {table.description && (
                    <p className="text-sm text-gray-400 mb-4">{table.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{table.rowCount.toLocaleString()} rows</span>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Key className="w-3 h-3" />
                      <span>{table.columns.filter(c => c.isPrimaryKey).length}</span>
                      <GitBranch className="w-3 h-3 ml-2" />
                      <span>{table.columns.filter(c => c.isForeignKey).length}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'er-diagram' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white flex items-center">
                    <Share2 className="w-6 h-6 mr-3 text-blue-400" />
                    ER Diagram - {currentSchema.name} Schema
                  </h2>
                  <p className="text-gray-400 mt-1">Interactive visual representation of table relationships</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Move className="w-4 h-4" />
                  <span>Drag tables to rearrange</span>
                </div>
              </div>
            </div>
            <ERDiagram />
          </div>
        )}

        {activeTab === 'tables' && (
          <div>
            <div className="mb-6">
              <div className="flex space-x-1 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 overflow-x-auto">
                {currentSchema.tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => handleTableClick(table.name)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                      selectedTable === table.name
                        ? 'bg-white/20 text-white shadow-lg border border-white/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Table className="w-4 h-4 mr-2 inline" />
                    {table.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedTable && currentTable ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-white flex items-center">
                        <Table className="w-6 h-6 mr-3 text-blue-400" />
                        {selectedTable}
                      </h2>
                      {currentTable.description && (
                        <p className="text-gray-400 mt-1">{currentTable.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-400">
                          {currentTable.rowCount.toLocaleString()} rows
                        </span>
                        <span className="text-sm text-gray-400">
                          {currentTable.columns.length} columns
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl flex items-center border border-white/20 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                      <button className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg">
                        Add Row
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search table data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <button className="px-4 py-3 text-sm bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl flex items-center border border-white/20 transition-colors">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        {currentTable.columns.map((column) => (
                          <th
                            key={column.name}
                            className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                          >
                            <div className="flex items-center space-x-2">
                              {getColumnIcon(column)}
                              <span>{column.name}</span>
                              {!column.nullable && (
                                <span className="text-red-400">*</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-normal mt-1">
                              {column.type}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {paginatedData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-white/5 transition-colors">
                          {currentTable.columns.map((column) => (
                            <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <div className="max-w-xs truncate">
                                {row[column.name] === null || row[column.name] === undefined ? (
                                  <span className="text-gray-500 italic">NULL</span>
                                ) : typeof row[column.name] === 'boolean' ? (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    row[column.name] 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    {row[column.name] ? 'true' : 'false'}
                                  </span>
                                ) : column.type.includes('timestamp') ? (
                                  new Date(row[column.name]).toLocaleString()
                                ) : (
                                  String(row[column.name])
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between rounded-b-2xl">
                  <div className="text-sm text-gray-400">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTableData.length)} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredTableData.length)} of{' '}
                    {filteredTableData.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-400 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-300 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-12 text-center">
                <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Select a Table</h3>
                <p className="text-gray-400">
                  Choose a table from the tabs above to view its data and structure.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/5 rounded-full blur-lg"></div>
    </div>
  );
};

export default DatabaseViewer;