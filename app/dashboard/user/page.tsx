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
import { Textarea } from "@/components/ui/textarea";

interface UserProfile {
  user: {
    username: string;
    role: string;
    code: string;
    createdAt: string;
  };
  records: Array<{
    _id: string;
    name: string;
    title?: string;
    phoneNumbers: string[];
    mails: string[];
    website?: string;
    photo?: string;
    createdAt: string;
  }>;
  files: Array<{
    _id: string;
    mail: string;
    mailSubject: string;
    mailBody: string;
    fileLinks: string[];
    createdAt: string;
  }>;
}

export default function UserDashboard() {
  const { isAuthenticated, isUser, token, user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New file form state
  const [newFile, setNewFile] = useState({
    mail: "",
    mailSubject: "",
    mailBody: "",
    fileLinks: [""]
  });
  const [creatingFile, setCreatingFile] = useState(false);

  // Edit states
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState({
    name: "",
    title: "",
    phoneNumbers: [""],
    mails: [""],
    website: "",
    photo: ""
  });
  const [editFile, setEditFile] = useState({
    mail: "",
    mailSubject: "",
    mailBody: "",
    fileLinks: [""]
  });
  const [updating, setUpdating] = useState(false);

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
    // Don't redirect while auth is loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isUser) {
      router.push("/dashboard/admin");
      return;
    }

    fetchProfile();
  }, [isAuthenticated, isUser, router, authLoading]);

  const fetchProfile = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        if (response.status === 401) {
          console.error("🔑 Token is invalid or expired. Logging out...");
          logout();
          router.push("/login");
          return;
        }
        setError("Failed to fetch profile");
      }
    } catch (err) {
      setError("Failed to fetch profile");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };



  const createFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setCreatingFile(true);
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newFile,
          fileLinks: newFile.fileLinks.filter(f => f.trim())
        })
      });

      if (response.ok) {
        setNewFile({
          mail: "",
          mailSubject: "",
          mailBody: "",
          fileLinks: [""]
        });
        fetchProfile(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create file");
      }
    } catch (err) {
      setError("Failed to create file");
      console.error("Create file error:", err);
    } finally {
      setCreatingFile(false);
    }
  };



  const addFileLink = () => {
    setNewFile({
      ...newFile,
      fileLinks: [...newFile.fileLinks, ""]
    });
  };

  const updateFileLink = (index: number, value: string) => {
    const updated = [...newFile.fileLinks];
    updated[index] = value;
    setNewFile({
      ...newFile,
      fileLinks: updated
    });
  };

  const startEditRecord = (record: any) => {
    setEditingRecord(record._id);
    setEditRecord({
      name: record.name,
      title: record.title || "",
      phoneNumbers: record.phoneNumbers.length > 0 ? record.phoneNumbers : [""],
      mails: record.mails.length > 0 ? record.mails : [""],
      website: record.website || "",
      photo: record.photo || ""
    });
  };

  const startEditFile = (file: any) => {
    setEditingFile(file._id);
    setEditFile({
      mail: file.mail,
      mailSubject: file.mailSubject,
      mailBody: file.mailBody,
      fileLinks: file.fileLinks.length > 0 ? file.fileLinks : [""]
    });
  };

  const updateRecord = async (recordId: string) => {
    if (!token) return;

    try {
      setUpdating(true);
      const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editRecord,
          phoneNumbers: editRecord.phoneNumbers.filter(p => p.trim()),
          mails: editRecord.mails.filter(m => m.trim())
        })
      });

      if (response.ok) {
        setEditingRecord(null);
        fetchProfile(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update record");
      }
    } catch (err) {
      setError("Failed to update record");
      console.error("Update record error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const updateFile = async (fileId: string) => {
    if (!token) return;

    try {
      setUpdating(true);
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editFile,
          fileLinks: editFile.fileLinks.filter(f => f.trim())
        })
      });

      if (response.ok) {
        setEditingFile(null);
        fetchProfile(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update file");
      }
    } catch (err) {
      setError("Failed to update file");
      console.error("Update file error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!token || !confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchProfile(); // Refresh data
      } else {
        setError("Failed to delete record");
      }
    } catch (err) {
      setError("Failed to delete record");
      console.error("Delete record error:", err);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!token || !confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchProfile(); // Refresh data
      } else {
        setError("Failed to delete file");
      }
    } catch (err) {
      setError("Failed to delete file");
      console.error("Delete file error:", err);
    }
  };

  const updateEditArrayField = (field: 'phoneNumbers' | 'mails', index: number, value: string) => {
    const updated = [...editRecord[field]];
    updated[index] = value;
    setEditRecord({
      ...editRecord,
      [field]: updated
    });
  };

  const addEditArrayField = (field: 'phoneNumbers' | 'mails') => {
    setEditRecord({
      ...editRecord,
      [field]: [...editRecord[field], ""]
    });
  };

  const updateEditFileLink = (index: number, value: string) => {
    const updated = [...editFile.fileLinks];
    updated[index] = value;
    setEditFile({
      ...editFile,
      fileLinks: updated
    });
  };

  const addEditFileLink = () => {
    setEditFile({
      ...editFile,
      fileLinks: [...editFile.fileLinks, ""]
    });
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Checking authentication</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isUser) {
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
                <h1 className="text-2xl font-bold">My Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome, {user?.username}
                </p>
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
                <p className="text-muted-foreground">Fetching your data from API</p>
              </div>
            </div>
          ) : profile ? (
            <div className="w-full space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{profile.records.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{profile.files.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Your Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono tracking-wider">{profile.user.code}</div>
                      <p className="text-xs text-muted-foreground mt-1">Your unique access code</p>
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

              {activeTab === 'records' && (
                <div className="space-y-4">

                <Card>
                  <CardHeader>
                    <CardTitle>My Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.records.map((record) => (
                        <div key={record._id} className="p-3 border rounded">
                          {editingRecord === record._id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Name *</Label>
                                  <Input
                                    value={editRecord.name}
                                    onChange={(e) => setEditRecord({...editRecord, name: e.target.value})}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Title</Label>
                                  <Input
                                    value={editRecord.title}
                                    onChange={(e) => setEditRecord({...editRecord, title: e.target.value})}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Phone Numbers</Label>
                                  {editRecord.phoneNumbers.map((phone, index) => (
                                    <div key={index} className="flex gap-2 mt-2">
                                      <Input
                                        value={phone}
                                        onChange={(e) => updateEditArrayField('phoneNumbers', index, e.target.value)}
                                        placeholder="Phone number"
                                      />
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addEditArrayField('phoneNumbers')}
                                    className="mt-2"
                                  >
                                    Add Phone
                                  </Button>
                                </div>

                                <div>
                                  <Label>Email Addresses</Label>
                                  {editRecord.mails.map((email, index) => (
                                    <div key={index} className="flex gap-2 mt-2">
                                      <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => updateEditArrayField('mails', index, e.target.value)}
                                        placeholder="Email address"
                                      />
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addEditArrayField('mails')}
                                    className="mt-2"
                                  >
                                    Add Email
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Website</Label>
                                  <Input
                                    type="url"
                                    value={editRecord.website}
                                    onChange={(e) => setEditRecord({...editRecord, website: e.target.value})}
                                    placeholder="https://example.com"
                                  />
                                </div>
                                <div>
                                  <Label>Photo URL</Label>
                                  <Input
                                    type="url"
                                    value={editRecord.photo}
                                    onChange={(e) => setEditRecord({...editRecord, photo: e.target.value})}
                                    placeholder="https://example.com/photo.jpg"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => updateRecord(record._id)}
                                  disabled={updating}
                                  size="sm"
                                >
                                  {updating ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingRecord(null)}
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{record.name}</div>
                                  {record.title && <div className="text-sm text-muted-foreground">{record.title}</div>}
                                  <div className="mt-2 space-y-1">
                                    {record.phoneNumbers.length > 0 && (
                                      <div className="text-sm">📞 {record.phoneNumbers.join(', ')}</div>
                                    )}
                                    {record.mails.length > 0 && (
                                      <div className="text-sm">✉️ {record.mails.join(', ')}</div>
                                    )}
                                    {record.website && (
                                      <div className="text-sm">🌐 <a href={record.website} target="_blank" className="text-blue-500 hover:underline">{record.website}</a></div>
                                    )}
                                  </div>
                                </div>
                                {record.photo && (
                                  <img src={record.photo} alt={record.name} className="w-12 h-12 rounded-full object-cover ml-4" />
                                )}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                  Created: {new Date(record.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditRecord(record)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteRecord(record._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {profile.records.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No records yet. Create your first record above!</p>
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
                    <CardTitle>Create New File Entry</CardTitle>
                    <CardDescription>Add email metadata and file links</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createFile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mail">Sender Email *</Label>
                          <Input
                            id="mail"
                            type="email"
                            value={newFile.mail}
                            onChange={(e) => setNewFile({...newFile, mail: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="mailSubject">Subject *</Label>
                          <Input
                            id="mailSubject"
                            value={newFile.mailSubject}
                            onChange={(e) => setNewFile({...newFile, mailSubject: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="mailBody">Message Body</Label>
                        <Textarea
                          id="mailBody"
                          value={newFile.mailBody}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewFile({...newFile, mailBody: e.target.value})}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>File Links</Label>
                        {newFile.fileLinks.map((link, index) => (
                          <div key={index} className="flex gap-2 mt-2">
                            <Input
                              value={link}
                              onChange={(e) => updateFileLink(index, e.target.value)}
                              placeholder="https://example.com/file.pdf"
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addFileLink}
                          className="mt-2"
                        >
                          Add File Link
                        </Button>
                      </div>

                      <Button type="submit" disabled={creatingFile}>
                        {creatingFile ? "Creating..." : "Create File Entry"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.files.map((file) => (
                        <div key={file._id} className="p-3 border rounded">
                          {editingFile === file._id ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Sender Email *</Label>
                                  <Input
                                    type="email"
                                    value={editFile.mail}
                                    onChange={(e) => setEditFile({...editFile, mail: e.target.value})}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Subject *</Label>
                                  <Input
                                    value={editFile.mailSubject}
                                    onChange={(e) => setEditFile({...editFile, mailSubject: e.target.value})}
                                    required
                                  />
                                </div>
                              </div>

                              <div>
                                <Label>Message Body</Label>
                                <Textarea
                                  value={editFile.mailBody}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditFile({...editFile, mailBody: e.target.value})}
                                  rows={3}
                                />
                              </div>

                              <div>
                                <Label>File Links</Label>
                                {editFile.fileLinks.map((link, index) => (
                                  <div key={index} className="flex gap-2 mt-2">
                                    <Input
                                      value={link}
                                      onChange={(e) => updateEditFileLink(index, e.target.value)}
                                      placeholder="https://example.com/file.pdf"
                                    />
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addEditFileLink}
                                  className="mt-2"
                                >
                                  Add File Link
                                </Button>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => updateFile(file._id)}
                                  disabled={updating}
                                  size="sm"
                                >
                                  {updating ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingFile(null)}
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{file.mailSubject}</div>
                              <div className="text-sm text-muted-foreground">To: {file.mail}</div>
                              {file.mailBody && (
                                <div className="text-sm mt-2 p-2 bg-muted rounded">{file.mailBody}</div>
                              )}
                              <div className="mt-2">
                                <div className="text-sm font-medium">Files ({file.fileLinks.length}):</div>
                                {file.fileLinks.map((link, index) => (
                                  <div key={index} className="text-sm">
                                    <a href={link} target="_blank" className="text-blue-500 hover:underline">
                                      📎 {link}
                                    </a>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                  Created: {new Date(file.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditFile(file)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteFile(file._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {profile.files.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No files yet. Create your first file entry above!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-destructive">Failed to load profile data</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}