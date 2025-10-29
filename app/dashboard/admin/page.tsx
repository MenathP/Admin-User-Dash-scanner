"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiUser {
  id: string;
  username: string;
  role: string;
  code: string;
  createdAt: string;
}

interface ApiRecord {
  _id: string;
  name: string;
  title?: string;
  phoneNumbers: string[];
  mails: string[];
  website?: string;
  photo?: string;
  code: string;
  createdAt: string;
}

interface ApiFile {
  _id: string;
  mail: string;
  mailSubject: string;
  mailBody: string;
  fileLinks: string[];
  code: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New user form state
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user" as "user" | "admin"
  });
  const [creating, setCreating] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api';

  // Helper function to handle 401 errors
  const handleUnauthorized = (response: Response) => {
    if (response.status === 401) {
      console.error("🔑 Token is invalid or expired. Logging out...");
      logout();
      router.push("/login");
      return true;
    }
    return false;
  };

  useEffect(() => {
    console.log("Admin Dashboard useEffect triggered", {
      authLoading,
      isAuthenticated,
      isAdmin,
      hasToken: !!token
    });

    // Don't redirect while auth is loading
    if (authLoading) {
      console.log("Still loading auth, waiting...");
      return;
    }
    
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      router.push("/login");
      return;
    }

    if (!isAdmin) {
      console.log("Not admin, redirecting to user dashboard");
      router.push("/dashboard/user");
      return;
    }

    console.log("Admin authenticated, fetching data...");
    fetchData();
  }, [isAuthenticated, isAdmin, router, authLoading, token]);

  const fetchData = async () => {
    if (!token) {
      console.log("No token available for API calls");
      return;
    }

    try {
      setLoading(true);
      setError(""); // Clear previous errors
      
      console.log("Fetching data from API...", { API_BASE_URL, hasToken: !!token });
      
      // Fetch users
      console.log("Fetching users from:", `${API_BASE_URL}/users`);
      console.log("Authorization header:", `Bearer ${token?.substring(0, 20)}...`);
      
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Users response status:", usersResponse.status);
      console.log("Users response headers:", Object.fromEntries(usersResponse.headers.entries()));
      
      if (usersResponse.ok) {
        const responseText = await usersResponse.text();
        console.log("Raw users response:", responseText);
        
        try {
          const usersData = JSON.parse(responseText);
          console.log("Parsed users data:", usersData);
          console.log("Is users data an array?", Array.isArray(usersData));
          console.log("Users data type:", typeof usersData);
          console.log("Users data length:", usersData?.length);
          
          let userArray = [];
          
          // Handle different response formats
          if (Array.isArray(usersData)) {
            userArray = usersData;
            console.log("✅ Data is direct array");
          } else if (usersData && Array.isArray(usersData.users)) {
            userArray = usersData.users;
            console.log("✅ Found users in data.users property");
          } else if (usersData && Array.isArray(usersData.data)) {
            userArray = usersData.data;
            console.log("✅ Found users in data.data property");
          } else if (usersData && typeof usersData === 'object') {
            console.log("📋 Response object keys:", Object.keys(usersData));
            // Try to find an array property
            for (const [key, value] of Object.entries(usersData)) {
              if (Array.isArray(value)) {
                userArray = value;
                console.log(`✅ Found array in data.${key} property`);
                break;
              }
            }
          }

          if (userArray.length > 0 || Array.isArray(usersData)) {
            setUsers(userArray);
            console.log("✅ Users set successfully:", userArray.length, "users");
          } else {
            console.warn("⚠️ No user array found in response:", usersData);
            console.log("📋 Available keys:", Object.keys(usersData || {}));
            setUsers([]);
            setError(`API returned unexpected format. Available keys: ${Object.keys(usersData || {}).join(', ')}`);
          }
        } catch (parseError) {
          console.error("❌ Failed to parse users JSON:", parseError);
          console.error("Raw response that failed to parse:", responseText);
          setError(`Failed to parse users response: ${parseError}`);
        }
      } else {
        const errorText = await usersResponse.text();
        console.error("❌ Failed to fetch users:", usersResponse.status, errorText);
        
        // Handle token expiration/invalid token
        if (usersResponse.status === 401) {
          console.error("🔑 Token is invalid or expired. Logging out...");
          logout();
          router.push("/login");
          return;
        }
        
        setError(`Failed to fetch users: ${usersResponse.status} - ${errorText}`);
      }

      // Fetch all records (admin can see all)
      console.log("Fetching records from:", `${API_BASE_URL}/records`);
      const recordsResponse = await fetch(`${API_BASE_URL}/records`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        console.log("Records data received:", recordsData);
        setRecords(Array.isArray(recordsData) ? recordsData : []);
      } else {
        console.error("Failed to fetch records:", recordsResponse.status);
        if (recordsResponse.status === 401) {
          console.error("🔑 Token is invalid or expired. Logging out...");
          logout();
          router.push("/login");
          return;
        }
      }

      // Fetch all files (admin can see all)
      console.log("Fetching files from:", `${API_BASE_URL}/files`);
      const filesResponse = await fetch(`${API_BASE_URL}/files`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        console.log("Files data received:", filesData);
        setFiles(Array.isArray(filesData) ? filesData : []);
      } else {
        console.error("Failed to fetch files:", filesResponse.status);
        if (filesResponse.status === 401) {
          console.error("🔑 Token is invalid or expired. Logging out...");
          logout();
          router.push("/login");
          return;
        }
      }

    } catch (err) {
      const errorMessage = `Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setCreating(true);
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setNewUser({ username: "", password: "", role: "user" });
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create user");
      }
    } catch (err) {
      setError("Failed to create user");
      console.error("Create user error:", err);
    } finally {
      setCreating(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Checking authentication</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, records, and files</p>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Loading...</h3>
                <p className="text-muted-foreground">Fetching data from API</p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Array.isArray(users) ? users.length : 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0} admins, {Array.isArray(users) ? users.filter(u => u.role === 'user').length : 0} users
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Array.isArray(records) ? records.length : 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Array.isArray(files) ? files.length : 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Array.isArray(users) ? new Set(users.map(u => u.code)).size : 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {error && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <p className="text-destructive">{error}</p>
                    </CardContent>
                  </Card>
                )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>Add a new user to the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <select
                            id="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value as "user" | "admin"})}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>All Users ({Array.isArray(users) ? users.length : 0})</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchData}
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Refresh"}
                      </Button>
                    </div>
                    <CardDescription>
                      {loading ? "Fetching users from API..." : "Manage all system users"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading users...</p>
                        </div>
                      ) : Array.isArray(users) && users.length > 0 ? users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: <span className="font-mono">{user.code}</span> • Created: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No users found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {error ? "Check console for errors" : "Users will appear here once loaded from the API"}
                          </p>
                        </div>
                      )}
                      
                      {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
                          <p className="text-sm text-destructive font-medium">API Error:</p>
                          <p className="text-sm text-destructive/80">{error}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchData}
                            className="mt-2"
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}

              {activeTab === 'records' && (
                <div className="space-y-6">
                <Card className="bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle >
                      All Records ({Array.isArray(records) ? records.length : 0})
                    </CardTitle>
                    <CardDescription className="text-purple-700 dark:text-green-300">Manage all system records</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Array.isArray(records) && records.length > 0 ? records.map((record) => (
                        <div key={record._id} className="p-5 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-green-300 dark:hover:border-green-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-green-50 dark:hover:from-slate-800 dark:hover:to-green-950 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-lg text-slate-900 dark:text-slate-100">{record.name}</div>
                              {record.title && <div className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">{record.title}</div>}
                              <div className="mt-3 space-y-1">
                                {record.phoneNumbers.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                    <span className="text-slate-700 dark:text-slate-300">{record.phoneNumbers.join(', ')}</span>
                                  </div>
                                )}
                                {record.mails.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                    <span className="text-slate-700 dark:text-slate-300">{record.mails.join(', ')}</span>
                                  </div>
                                )}
                                {record.website && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                    <a href={record.website} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{record.website}</a>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1">
                                Code: {record.code}
                              </Badge>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this record?")) {
                                    try {
                                      const response = await fetch(`${API_BASE_URL}/records/${record._id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                      if (response.ok) {
                                        fetchData(); // Refresh data
                                      }
                                    } catch (error) {
                                      console.error("Delete error:", error);
                                    }
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                          <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 rounded-sm mx-auto mb-4"></div>
                          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">No records found</p>
                          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Records will appear here once loaded from the API</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-6">
                <Card >
                  <CardHeader >
                    <CardTitle >
                    
                      All Files ({Array.isArray(files) ? files.length : 0})
                    </CardTitle>
                    <CardDescription className="text-purple-700 dark:text-purple-300">Manage all system files and attachments</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Array.isArray(files) && files.length > 0 ? files.map((file) => (
                        <div key={file._id} className="p-5 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-purple-300 dark:hover:border-purple-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-purple-950 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">{file.mailSubject}</div>
                              <div className="flex items-center gap-2 text-sm mb-3">
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                <span className="text-slate-600 dark:text-slate-400">From: {file.mail}</span>
                              </div>
                              {file.mailBody && (
                                <div className="text-sm mt-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                  <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{file.mailBody}</div>
                                </div>
                              )}
                              <div className="mt-4">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                  <div className="w-3 h-3 bg-purple-600 rounded-sm"></div>
                                  Files ({file.fileLinks.length}):
                                </div>
                                <div className="space-y-1">
                                  {file.fileLinks.map((link, index) => (
                                    <div key={index} className="text-sm">
                                      <a 
                                        href={link} 
                                        target="_blank" 
                                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                                      >
                                        <span>�</span>
                                        {link.split('/').pop() || link}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1">
                                Code: {file.code}
                              </Badge>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this file?")) {
                                    try {
                                      const response = await fetch(`${API_BASE_URL}/files/${file._id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                      if (response.ok) {
                                        fetchData(); // Refresh data
                                      }
                                    } catch (error) {
                                      console.error("Delete error:", error);
                                    }
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <span>🕒</span>
                              Created: {new Date(file.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                          <div className="text-4xl mb-4">📁</div>
                          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">No files found</p>
                          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Files will appear here once loaded from the API</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}