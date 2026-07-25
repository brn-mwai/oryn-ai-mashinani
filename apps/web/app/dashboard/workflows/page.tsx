"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconGitBranch,
  IconClock,
  IconMail,
  IconAlertTriangle,
  IconFileText,
  IconCreditCard,
  IconCheck,
  IconSettings,
  IconPlayerPlay,
  IconChartBar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const WORKFLOW_CONFIG = {
  auto_reminder: {
    icon: IconClock,
    label: "Automatic Reminders",
    description: "Send reminders when invoices become overdue",
  },
  smart_escalation: {
    icon: IconAlertTriangle,
    label: "Smart Escalation",
    description: "Automatically escalate claims based on age",
  },
  payment_confirmation: {
    icon: IconCreditCard,
    label: "Payment Confirmation",
    description: "Send thank you messages when payments arrive",
  },
  document_processing: {
    icon: IconFileText,
    label: "Document Processing",
    description: "Extract data from uploaded documents",
  },
  multi_channel: {
    icon: IconMail,
    label: "Multi-Channel Outreach",
    description: "Coordinate messages across email, SMS, and WhatsApp",
  },
};

type WorkflowType = keyof typeof WORKFLOW_CONFIG;

export default function WorkflowsPage() {
  const { user } = useUser();

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflows" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const workflows = useQuery(
    api.workflows.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const initializeDefaults = useMutation(api.workflows.initializeDefaults);
  const toggleWorkflow = useMutation(api.workflows.toggle);

  // Initialize default workflows if none exist
  useEffect(() => {
    if (convexUser?._id && workflows && workflows.length === 0) {
      initializeDefaults({ userId: convexUser._id });
    }
  }, [convexUser?._id, workflows, initializeDefaults]);

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleWorkflow({ id: id as any, enabled });
  };

  const activeCount = workflows?.filter((w) => w.enabled).length || 0;
  const totalRuns = workflows?.reduce((sum, w) => sum + w.stats.totalRuns, 0) || 0;
  const successRate = workflows && workflows.length > 0
    ? Math.round(
        (workflows.reduce((sum, w) => sum + w.stats.successfulRuns, 0) /
          Math.max(workflows.reduce((sum, w) => sum + w.stats.totalRuns, 0), 1)) *
          100
      )
    : 0;

  const isLoading = !convexUser || workflows === undefined;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">AI Workflows</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automate your collection process with AI-powered workflows
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                <IconPlayerPlay size={20} className="text-accent" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-8 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold">{activeCount}</p>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                <IconChartBar size={20} className="text-accent" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-12 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold">{totalRuns}</p>
                    <p className="text-sm text-muted-foreground">Total Runs</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                <IconCheck size={20} className="text-accent" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-12 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold">{successRate}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <h2 className="font-semibold">Your Workflows</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12" />
                      <div>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </div>
                    <Skeleton className="w-12 h-6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workflows && workflows.length > 0 ? (
          <div className="space-y-4">
            {workflows.map((workflow) => {
              const config = WORKFLOW_CONFIG[workflow.type as WorkflowType];
              const Icon = config?.icon || IconGitBranch;

              return (
                <Card key={workflow._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-accent/10 flex items-center justify-center">
                          <Icon size={24} className="text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {workflow.description || config?.description}
                          </p>

                          {/* Trigger info */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconClock size={12} />
                              Trigger: {workflow.trigger.event.replace(/_/g, " ")}
                            </span>
                            <span>
                              {workflow.actions.length} action{workflow.actions.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Stats */}
                          {workflow.stats.totalRuns > 0 && (
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-muted-foreground">
                                {workflow.stats.totalRuns} runs
                              </span>
                              <span className="text-green-600">
                                {workflow.stats.successfulRuns} successful
                              </span>
                              {workflow.stats.failedRuns > 0 && (
                                <span className="text-red-500">
                                  {workflow.stats.failedRuns} failed
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm">
                          <IconSettings size={16} />
                        </Button>
                        <Switch
                          checked={workflow.enabled}
                          onCheckedChange={(enabled) => handleToggle(workflow._id, enabled)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4">
                <IconGitBranch size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No workflows yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Workflows help automate your collection process
              </p>
              <Button
                className="bg-accent hover:bg-accent/90"
                onClick={() => convexUser?._id && initializeDefaults({ userId: convexUser._id })}
              >
                Create Default Workflows
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How it works */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How Workflows Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Trigger</p>
                  <p className="text-xs text-muted-foreground">
                    Workflows activate when specific events occur, like overdue invoices
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">AI Processing</p>
                  <p className="text-xs text-muted-foreground">
                    AI analyzes the situation and generates personalized actions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Execute</p>
                  <p className="text-xs text-muted-foreground">
                    Actions are executed automatically - send emails, escalate claims, etc.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
