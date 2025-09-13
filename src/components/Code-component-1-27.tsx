import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Camera, MapPin, Upload, LogOut, Send, Clock, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface UserHomeProps {
  user: User;
  onLogout: () => void;
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
}

export function UserHome({ user, onLogout }: UserHomeProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'myReports'>('report');
  const [reports, setReports] = useState<Report[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'pothole',
    imageUrl: '',
    address: '',
    village: '',
    district: '',
    pincode: '',
    state: ''
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load user's reports
    const allReports = JSON.parse(localStorage.getItem('reports') || '[]');
    setReports(allReports.filter((report: Report) => report.userId === user.id));
  }, [user.id]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert('error', 'Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        showAlert('success', 'Location captured successfully');
        
        // Mock reverse geocoding
        setFormData(prev => ({
          ...prev,
          village: 'Sample Village',
          district: 'Sample District',
          pincode: '123456',
          state: 'Sample State',
          address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        }));
      },
      (error) => {
        showAlert('error', 'Unable to get location. Please enter manually.');
      }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsUsingCamera(true);
      }
    } catch (error) {
      showAlert('error', 'Unable to access camera. Please use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, imageUrl: imageDataUrl }));
        stopCamera();
        showAlert('success', 'Photo captured successfully');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsUsingCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, imageUrl: e.target?.result as string }));
        showAlert('success', 'Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReport = () => {
    if (!formData.title || !formData.description || !formData.imageUrl) {
      showAlert('error', 'Please fill all required fields and add an image');
      return;
    }

    if (!location && !formData.address) {
      showAlert('error', 'Please capture location or enter address manually');
      return;
    }

    const newReport: Report = {
      id: Date.now().toString(),
      userId: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      imageUrl: formData.imageUrl,
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        address: formData.address,
        village: formData.village,
        district: formData.district,
        pincode: formData.pincode,
        state: formData.state
      },
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    const allReports = JSON.parse(localStorage.getItem('reports') || '[]');
    allReports.push(newReport);
    localStorage.setItem('reports', JSON.stringify(allReports));
    setReports(prev => [...prev, newReport]);

    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'pothole',
      imageUrl: '',
      address: '',
      village: '',
      district: '',
      pincode: '',
      state: ''
    });
    setLocation(null);
    
    showAlert('success', 'Report submitted successfully!');
    setActiveTab('myReports');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl">Civic Issue Reporter</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'report' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('report')}
            className="flex-1"
          >
            Report Issue
          </Button>
          <Button
            variant={activeTab === 'myReports' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('myReports')}
            className="flex-1"
          >
            My Reports ({reports.length})
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {activeTab === 'report' && (
          <Card>
            <CardHeader>
              <CardTitle>Report a Civic Issue</CardTitle>
              <CardDescription>
                Help improve your community by reporting issues like potholes, streetlight problems, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Capture Section */}
              <div className="space-y-4">
                <Label>Issue Photo *</Label>
                {!formData.imageUrl && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button onClick={startCamera} variant="outline" className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Use Camera
                      </Button>
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {isUsingCamera && (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={capturePhoto}>Capture Photo</Button>
                      <Button onClick={stopCamera} variant="outline">Cancel</Button>
                    </div>
                  </div>
                )}

                {formData.imageUrl && (
                  <div className="space-y-2">
                    <img 
                      src={formData.imageUrl} 
                      alt="Issue" 
                      className="w-full max-w-sm mx-auto rounded-lg" 
                    />
                    <Button 
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      variant="outline"
                      className="w-full"
                    >
                      Change Photo
                    </Button>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Location</Label>
                  <Button onClick={getCurrentLocation} variant="outline" size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Current Location
                  </Button>
                </div>
                
                {location && (
                  <Alert>
                    <MapPin className="w-4 h-4" />
                    <AlertDescription>
                      Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="village">Village/Area</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                      placeholder="Village or area name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      placeholder="District name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pin Code</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Pin code"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State name"
                    />
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Issue Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="pothole">Pothole</option>
                    <option value="streetlight">Streetlight Issue</option>
                    <option value="garbage">Garbage/Waste</option>
                    <option value="drainage">Drainage Problem</option>
                    <option value="traffic">Traffic Signal</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief title for the issue"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the issue"
                    rows={4}
                  />
                </div>
              </div>

              <Button onClick={submitReport} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'myReports' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">My Reports</h2>
              <Badge variant="outline">{reports.length} reports</Badge>
            </div>

            {reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">No reports submitted yet.</p>
                  <Button onClick={() => setActiveTab('report')} className="mt-4">
                    Submit Your First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={report.imageUrl} 
                          alt={report.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{report.title}</h3>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {report.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {report.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{report.description}</p>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}