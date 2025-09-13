import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Camera, MapPin, Upload, LogOut, Send } from 'lucide-react';

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
  imageUrls: string[];
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

export default function UserHome({ user, onLogout }: UserHomeProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'myReports'>('report');
  const [reports, setReports] = useState<Report[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'pothole',
    imageUrls: [] as string[],
    address: '',
    village: '',
    district: '',
    pincode: '',
    state: ''
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debug states
  const [videoMetrics, setVideoMetrics] = useState({ videoWidth: 0, videoHeight: 0, readyState: 0 });
  const [streamInfo, setStreamInfo] = useState<{ trackCount: number; tracks: string[] }>({ trackCount: 0, tracks: [] });
  const [lastCameraError, setLastCameraError] = useState<string | null>(null);
  const [lastActionLog, setLastActionLog] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const pushLog = (msg: string) => {
    const entry = `${new Date().toISOString()} - ${msg}`;
    console.debug(entry);
    setLastActionLog(prev => [entry, ...prev].slice(0, 40));
  };

  // Attach stream to <video>
  useEffect(() => {
    if (isUsingCamera && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => pushLog(`videoRef.play() failed: ${err?.message || err}`));
      pushLog("✅ Stream attached to video element");
    }
  }, [isUsingCamera, cameraStream]);

  useEffect(() => {
    if (cameraStream) {
      const tracks = cameraStream.getTracks();
      setStreamInfo({
        trackCount: tracks.length,
        tracks: tracks.map(t => `${t.kind}:${t.readyState}`)
      });
      pushLog(`streamInfo updated: ${tracks.length} track(s)`);
    }
  }, [cameraStream]);

  // Load reports from localStorage
  useEffect(() => {
    const allReports: any[] = JSON.parse(localStorage.getItem('reports') || '[]');
    const filtered = allReports.filter((report: Report) => report.userId === user.id);
    setReports(filtered);
    pushLog(`Loaded ${filtered.length} reports from localStorage for user ${user.id}`);
  }, [user.id]);

  // Track video metrics
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateMetrics = () => {
      setVideoMetrics({
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
      pushLog(`video event - dims: ${video.videoWidth}x${video.videoHeight}, readyState: ${video.readyState}`);
    };

    video.addEventListener('loadedmetadata', updateMetrics);
    video.addEventListener('play', updateMetrics);

    return () => {
      video.removeEventListener('loadedmetadata', updateMetrics);
      video.removeEventListener('play', updateMetrics);
    };
  }, [isUsingCamera]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    pushLog(`ALERT ${type.toUpperCase()}: ${message}`);
    setTimeout(() => setAlert(null), 5000);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert('error', 'Geolocation not supported');
      pushLog('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        showAlert('success', 'Location captured');
        setFormData(prev => ({
          ...prev,
          address: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
          village: 'Sample Village',
          district: 'Sample District',
          pincode: '123456',
          state: 'Sample State'
        }));
        pushLog(`Location: ${pos.coords.latitude}, ${pos.coords.longitude}`);
      },
      (err) => {
        showAlert('error', 'Unable to get location');
        setLastCameraError(`geolocation error: ${err.message}`);
        pushLog(`geolocation error: ${err.message}`);
      }
    );
  };

  const startCamera = async () => {
    pushLog("startCamera invoked. Requesting getUserMedia");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      pushLog(`getUserMedia succeeded. tracks=${stream.getTracks().length}`);
      setIsUsingCamera(true);
      setCameraStream(stream);
    } catch (err: any) {
      setLastCameraError(err?.message || String(err));
      pushLog(`startCamera failed: ${err?.message || err}`);
      showAlert("error", "Unable to access camera. Please use file upload instead.");
    }
  };

  const capturePhoto = () => {
    pushLog('capturePhoto invoked');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) {
        pushLog('capture aborted: video dimensions 0');
        showAlert('error', 'Video not ready');
        return;
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, imageDataUrl] }));
        pushLog('Photo captured');
        stopCamera();
        showAlert('success', 'Photo captured successfully');
      }
    }
  };

  const stopCamera = () => {
    pushLog('stopCamera invoked');
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStream(null);
    setIsUsingCamera(false);
    setStreamInfo({ trackCount: 0, tracks: [] });
    setVideoMetrics({ videoWidth: 0, videoHeight: 0, readyState: 0 });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    showAlert('success', 'Image(s) uploaded');
  };

  const submitReport = () => {
    if (!formData.title || !formData.description || formData.imageUrls.length === 0) {
      showAlert('error', 'Fill all fields and add image');
      return;
    }
    if (!location && !formData.address) {
      showAlert('error', 'Provide location or address');
      return;
    }
    const newReport: Report = {
      id: Date.now().toString(),
      userId: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      imageUrls: formData.imageUrls,
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
    setFormData({ title: '', description: '', category: 'pothole', imageUrls: [], address: '', village: '', district: '', pincode: '', state: '' });
    setLocation(null);
    showAlert('success', 'Report submitted');
    setActiveTab('myReports');
  };

  const removeImageAtIndex = (index: number) => {
    setFormData(prev => {
      const url = prev.imageUrls[index];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      return { ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) };
    });
  };

  return (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
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
            <CardDescription>Help improve your community by reporting issues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Camera + Upload */}
            <div className="space-y-4">
              <Label>Issue Photos *</Label>
              {!isUsingCamera ? (
                <div className="flex gap-2">
                  <Button onClick={startCamera} variant="outline" className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Use Camera
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm mx-auto rounded-lg" />
                  <div className="flex gap-2 justify-center">
                    <Button onClick={capturePhoto}>Capture Photo</Button>
                    <Button onClick={stopCamera} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Issue ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeImageAtIndex(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Location */}
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
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                />
                <Input
                  placeholder="Village"
                  value={formData.village}
                  onChange={(e) => setFormData((p) => ({ ...p, village: e.target.value }))}
                />
                <Input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value }))}
                />
                <Input
                  placeholder="Pin Code"
                  value={formData.pincode}
                  onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
                />
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                />
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-4">
              <Input
                placeholder="Issue Title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
              <Textarea
                placeholder="Issue Description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <Button onClick={submitReport} className="w-full">
              <Send className="w-4 h-4 mr-2" /> Submit Report
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'myReports' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, idx) => (
            <div key={idx} className="bg-white shadow-lg rounded-xl p-4 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.title}</h3>
              <p className="text-sm text-gray-700 mb-2">{report.description}</p>
              <p className="text-sm text-gray-500 mb-1">Category: {report.category}</p>
              <p className="text-xs text-gray-400 mb-2">
                Submitted on {new Date(report.timestamp).toLocaleString()}
              </p>

              {Array.isArray(report.imageUrls) && report.imageUrls.length > 0 && (
                <div className="flex items-center space-x-2">
                  <img
                    src={report.imageUrls[0]}
                    alt={report.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  {report.imageUrls.length > 1 && (
                    <p className="text-xs text-blue-600">
                      + {report.imageUrls.length - 1} more photo(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}
