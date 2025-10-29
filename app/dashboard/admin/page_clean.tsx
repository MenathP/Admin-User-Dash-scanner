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
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user" as "user" | "admin"
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001';

  const fetchData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError("");
    
    try {
      console.log("Fetching admin data with token:", token);
      
      const [usersRes, recordsRes, filesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/records`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log("Response status:", { 
        users: usersRes.status, 
        records: recordsRes.status, 
        files: filesRes.status 
      });

      if (usersRes.status === 401 || recordsRes.status === 401 || filesRes.status === 401) {
        console.log("401 error detected, logging out");
        logout();
        return;
      }

      if (usersRes.ok && recordsRes.ok && filesRes.ok) {
        const [usersData, recordsData, filesData] = await Promise.all([
          usersRes.json(),
          recordsRes.json(),
          filesRes.json()
        ]);
        
        console.log("Fetched data:", { 
          users: usersData.length, 
          records: recordsData.length, 
          files: filesData.length 
        });
        
        setUsers(usersData);
        setRecords(recordsData);
        setFiles(filesData);
      } else {
        setError("Failed to fetch data from API");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.ok) {
        setNewUser({ username: "", password: "", role: "user" });
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create user");
      }
    } catch (error) {
      setError("Failed to create user");
      console.error("Create user error:", error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin && token) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin, token]);

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
                            className="w-full px-3 py-2 border-2 rounded-md"
                            style={{backgroundColor: '#212121', color: '#ffffff', borderColor: '#212121', borderWidth: '2px'}}
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
                <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.isArray(records) ? records.map((record) => (
                        <div key={record._id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{record.name}</div>
                              {record.title && <div className="text-sm text-muted-foreground">{record.title}</div>}
                              <div className="mt-2 text-sm text-muted-foreground">
                                {record.phoneNumbers.length > 0 && <div>📞 {record.phoneNumbers.join(', ')}</div>}
                                {record.mails.length > 0 && <div>✉️ {record.mails.join(', ')}</div>}
                                {record.website && <div>🌐 <a href={record.website} target="_blank" className="text-blue-500 hover:underline">{record.website}</a></div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Code: {record.code}</Badge>
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
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-muted-foreground text-center py-4">No records found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.isArray(files) ? files.map((file) => (
                        <div key={file._id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{file.mailSubject}</div>
                              <div className="text-sm text-muted-foreground">From: {file.mail}</div>
                              {file.mailBody && (
                                <div className="text-sm mt-2 p-2 rounded text-xs" style={{backgroundColor: '#212121', color: '#ffffff'}}>{file.mailBody}</div>
                              )}
                              <div className="mt-2 text-sm">
                                <div className="font-medium">Files ({file.fileLinks.length}):</div>
                                {file.fileLinks.map((link, index) => (
                                  <div key={index} className="text-xs">
                                    <a href={link} target="_blank" className="text-blue-500 hover:underline">
                                      {link}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Code: {file.code}</Badge>
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
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Created: {new Date(file.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      )) : (
                        <p className="text-muted-foreground text-center py-4">No files found</p>
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