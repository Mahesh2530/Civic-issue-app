import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LogOut, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  TrendingUp,
  Filter,
  Eye,
  MessageSquare
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface Report {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    village: string;
    district: string;
    pincode: string;
    state: string;
  };
  status: 'pending' | 'in-progress' | 'resolved';
  timestamp: string;
  assignedTo?: string;
  department?: string;
  comments?: string;
}

interface AdminHomeProps {
  user: User;
  onLogout: () => void;
}

export function AdminHome({ user, onLogout }: AdminHomeProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    district: 'all'
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Load all reports
    const allReports = JSON.parse(localStorage.getItem('reports') || '[]');
    setReports(allReports);
    setFilteredReports(allReports);
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = reports;

    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(report => report.category === filters.category);
    }

    if (filters.district !== 'all') {
      filtered = filtered.filter(report => report.location.district === filters.district);
    }

    setFilteredReports(filtered);
  }, [reports, filters]);

  const updateReportStatus = (reportId: string, status: 'pending' | 'in-progress' | 'resolved', department?: string, comments?: string) => {
    const updatedReports = reports.map(report => 
      report.id === reportId 
        ? { ...report, status, department, comments, assignedTo: user.name }
        : report
    );
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
    
    if (selectedReport?.id === reportId) {
      setSelectedReport({ ...selectedReport, status, department, comments, assignedTo: user.name });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      pothole: 'bg-red-100 text-red-800',
      streetlight: 'bg-orange-100 text-orange-800',
      garbage: 'bg-brown-100 text-brown-800',
      drainage: 'bg-blue-100 text-blue-800',
      traffic: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getUniqueValues = (key: keyof Report | string) => {
    if (key === 'district') {
      return [...new Set(reports.map(report => report.location.district))].filter(Boolean);
    }
    return [...new Set(reports.map(report => report[key as keyof Report]))].filter(Boolean);
  };

  const getDashboardStats = () => {
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const inProgress = reports.filter(r => r.status === 'in-progress').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    
    return { total, pending, inProgress, resolved };
  };

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">All Reports</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Reports</p>
                      <p className="text-2xl font-semibold">{stats.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">In Progress</p>
                      <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Resolved</p>
                      <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Latest civic issues reported by citizens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img 
                        src={report.imageUrl} 
                        alt={report.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-gray-600">{report.location.village}, {report.location.district}</p>
                        <p className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getCategoryColor(report.category)}>
                          {report.category}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setActiveTab('reports');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="pothole">Pothole</SelectItem>
                        <SelectItem value="streetlight">Streetlight</SelectItem>
                        <SelectItem value="garbage">Garbage</SelectItem>
                        <SelectItem value="drainage">Drainage</SelectItem>
                        <SelectItem value="traffic">Traffic</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>District</Label>
                    <Select value={filters.district} onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {getUniqueValues('district').map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports Grid */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Reports ({filteredReports.length})</h3>
                {filteredReports.map((report) => (
                  <Card 
                    key={report.id} 
                    className={`cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={report.imageUrl} 
                          alt={report.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{report.title}</h4>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getCategoryColor(report.category)}>
                              {report.category}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            <p>📍 {report.location.village}, {report.location.district}</p>
                            <p>🕒 {new Date(report.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Report Details */}
              <div className="lg:sticky lg:top-6">
                {selectedReport ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Report Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <img 
                        src={selectedReport.imageUrl} 
                        alt={selectedReport.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      
                      <div>
                        <h4 className="font-medium">{selectedReport.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedReport.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(selectedReport.status)}>
                            {selectedReport.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getCategoryColor(selectedReport.category)}>
                            {selectedReport.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm">
                        <h5 className="font-medium mb-2">Location Details</h5>
                        <div className="space-y-1 text-gray-600">
                          <p>📍 {selectedReport.location.address}</p>
                          <p>🏘️ {selectedReport.location.village}</p>
                          <p>🏛️ {selectedReport.location.district}</p>
                          <p>📮 {selectedReport.location.pincode}</p>
                          <p>🗺️ {selectedReport.location.state}</p>
                          <p>📍 {selectedReport.location.latitude}, {selectedReport.location.longitude}</p>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p><strong>Submitted:</strong> {new Date(selectedReport.timestamp).toLocaleString()}</p>
                        {selectedReport.assignedTo && (
                          <p><strong>Assigned to:</strong> {selectedReport.assignedTo}</p>
                        )}
                      </div>

                      {selectedReport.status !== 'resolved' && (
                        <div className="space-y-3 pt-4 border-t">
                          <h5 className="font-medium">Update Status</h5>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => updateReportStatus(selectedReport.id, 'in-progress', 'Public Works')}
                              variant="outline"
                              size="sm"
                            >
                              Mark In Progress
                            </Button>
                            <Button 
                              onClick={() => updateReportStatus(selectedReport.id, 'resolved', 'Public Works', 'Issue resolved successfully')}
                              variant="default"
                              size="sm"
                            >
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Select a report to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Map View</CardTitle>
                <CardDescription>Geographic distribution of reported issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Interactive map would be displayed here</p>
                    <p className="text-sm text-gray-500 mt-2">Showing {reports.length} reported issues across different locations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reports by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['pothole', 'streetlight', 'garbage', 'drainage', 'traffic', 'other'].map(category => {
                      const count = reports.filter(r => r.category === category).length;
                      const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="capitalize">{category}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-green-600">
                        {stats.resolved > 0 ? '2.5 days' : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Average resolution time</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-medium">{((stats.resolved / (stats.total || 1)) * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">Resolution Rate</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium">{stats.total}</p>
                        <p className="text-xs text-gray-600">Total Reports</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}