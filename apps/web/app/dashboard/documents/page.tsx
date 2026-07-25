"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconUpload,
  IconFile,
  IconFileText,
  IconFileInvoice,
  IconReceipt,
  IconPhoto,
  IconVideo,
  IconSearch,
  IconFilter,
  IconCheck,
  IconClock,
  IconX,
  IconSparkles,
  IconTrash,
  IconDownload,
  IconEye,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeIcons: Record<string, React.ElementType> = {
  contract: IconFileText,
  invoice: IconFileInvoice,
  receipt: IconReceipt,
  proof: IconFile,
  image: IconPhoto,
  video: IconVideo,
  other: IconFile,
};

const typeColors: Record<string, string> = {
  contract: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  invoice: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  receipt: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  proof: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  image: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  video: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const parsingStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DocumentsPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Documents" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const documents = useQuery(
    api.documents.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const documentsData = documents ?? [];

  const filteredDocuments = documentsData.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documentsData.length,
    parsed: documentsData.filter((d) => d.parsingStatus === "completed").length,
    pending: documentsData.filter((d) => d.parsingStatus === "pending" || d.parsingStatus === "processing").length,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Button className="bg-accent hover:bg-accent/90">
          <IconUpload size={16} className="mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Documents</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconSparkles size={16} className="text-green-500" />
              <p className="text-sm text-muted-foreground">AI Parsed</p>
            </div>
            <p className="text-2xl font-semibold text-green-600">{stats.parsed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconClock size={16} className="text-yellow-500" />
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
            <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={typeFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            All
          </Button>
          <Button
            variant={typeFilter === "invoice" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("invoice")}
          >
            Invoices
          </Button>
          <Button
            variant={typeFilter === "contract" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("contract")}
          >
            Contracts
          </Button>
          <Button
            variant={typeFilter === "receipt" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("receipt")}
          >
            Receipts
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      {documents === undefined ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading documents...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFile size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No documents found</p>
            <Button>
              <IconUpload size={16} className="mr-2" />
              Upload your first document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const TypeIcon = typeIcons[doc.type] || IconFile;

            return (
              <Card key={doc._id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className={`w-10 h-10 flex items-center justify-center ${typeColors[doc.type]}`}>
                      <TypeIcon size={20} />
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">
                          {doc.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Parsing Status */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconSparkles size={14} className="text-purple-500" />
                      <span className={`text-xs px-2 py-0.5 rounded-full ${parsingStatusColors[doc.parsingStatus]}`}>
                        {doc.parsingStatus === "completed" ? "Parsed" : doc.parsingStatus}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Extracted Data Preview */}
                  {doc.extractedData && (
                    <div className="mt-3 p-2 bg-muted">
                      <p className="text-xs text-muted-foreground">Extracted:</p>
                      {doc.extractedData.title && (
                        <p className="text-sm font-medium truncate">{doc.extractedData.title}</p>
                      )}
                      {doc.extractedData.amounts && doc.extractedData.amounts.length > 0 && (
                        <p className="text-sm text-green-600">
                          ${doc.extractedData.amounts[0].value.toLocaleString()} {doc.extractedData.amounts[0].currency}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <IconEye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <IconDownload size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
