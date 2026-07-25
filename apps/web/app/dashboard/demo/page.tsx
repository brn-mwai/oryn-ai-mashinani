"use client";

import { useState } from "react";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconRocket,
  IconTrash,
  IconCheck,
  IconLoader2,
  IconAlertCircle,
  IconFileInvoice,
  IconUser,
  IconCreditCard,
  IconRobot,
  IconMail,
  IconBell,
  IconWallet,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SeedResult {
  success: boolean;
  data?: {
    userId: string;
    clientId: string;
    claimId: string;
    walletId: string;
    documentId: string;
    paymentLinkId: string;
    thoughtSignatureId: string;
    paymentLinkToken: string;
    paymentLinkUrl: string;
    debtorEmail: string;
  };
  message?: string;
  error?: string;
}

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [debtorEmail, setDebtorEmail] = useState("");

  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Demo Setup" },
  ]);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debtorEmail: debtorEmail || undefined
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: "Network error" });
    }
    setLoading(false);
  };

  const handleClear = async () => {
    setClearing(true);
    setResult(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "DELETE" });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: "Network error" });
    }
    setClearing(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <IconRocket className="text-accent" />
          Demo Setup
        </h1>
        <p className="text-muted-foreground mt-1">
          Seed realistic demo data for AI Mashinani 2026
        </p>
      </div>

      {/* What Gets Created */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What gets created?</CardTitle>
          <CardDescription>
            One click populates your dashboard with a complete collection scenario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted">
              <IconFileInvoice className="text-green-500" />
              <div>
                <p className="font-medium text-sm">Invoice PDF</p>
                <p className="text-xs text-muted-foreground">Parsed by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <IconUser className="text-blue-500" />
              <div>
                <p className="font-medium text-sm">Debtor</p>
                <p className="text-xs text-muted-foreground">Marcus Thompson</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <IconCreditCard className="text-purple-500" />
              <div>
                <p className="font-medium text-sm">Claim</p>
                <p className="text-xs text-muted-foreground">$7,000 USDC</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <IconRobot className="text-accent" />
              <div>
                <p className="font-medium text-sm">AI Agent State</p>
                <p className="text-xs text-muted-foreground">Thought Signature</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <IconMail className="text-orange-500" />
              <div>
                <p className="font-medium text-sm">Email History</p>
                <p className="text-xs text-muted-foreground">2 sent messages</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <IconWallet className="text-cyan-500" />
              <div>
                <p className="font-medium text-sm">Arc Wallet</p>
                <p className="text-xs text-muted-foreground">USDC ready</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seed Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seed Demo Data</CardTitle>
          <CardDescription>
            Optionally enter your email to receive demo emails (for testing the flow)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="debtorEmail">Debtor Email (optional)</Label>
            <Input
              id="debtorEmail"
              type="email"
              placeholder="your-email@example.com"
              value={debtorEmail}
              onChange={(e) => setDebtorEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank for default: marcus.thompson@thompsonassoc.com
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSeed}
              disabled={loading || clearing}
              className="bg-accent hover:bg-accent/90 flex-1"
            >
              {loading ? (
                <>
                  <IconLoader2 className="animate-spin mr-2" size={16} />
                  Seeding...
                </>
              ) : (
                <>
                  <IconRocket className="mr-2" size={16} />
                  Seed Demo Data
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              disabled={loading || clearing}
              variant="destructive"
            >
              {clearing ? (
                <IconLoader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <IconTrash className="mr-2" size={16} />
                  Clear
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={result.success ? "border-green-500" : "border-red-500"}>
          <CardContent className="p-4">
            {result.success ? (
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <IconCheck size={20} />
                  <span className="font-medium">{result.message}</span>
                </div>
                {result.data && (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Debtor Email:</strong>{" "}
                      <code className="bg-muted px-2 py-0.5">{result.data.debtorEmail}</code>
                    </p>
                    <p>
                      <strong>Payment Link:</strong>{" "}
                      <a
                        href={result.data.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        {result.data.paymentLinkUrl}
                      </a>
                    </p>
                    <div className="mt-4 p-3 bg-muted">
                      <p className="font-medium mb-2">Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Go to <a href="/dashboard/claims" className="text-accent hover:underline">Claims</a> to see the new claim</li>
                        <li>Go to <a href="/dashboard/documents" className="text-accent hover:underline">Documents</a> to see the parsed invoice</li>
                        <li>Go to <a href="/dashboard/clients" className="text-accent hover:underline">Clients</a> to see Marcus Thompson</li>
                        <li>Click the payment link to test the pay flow</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <IconAlertCircle size={20} />
                <span>{result.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invoice Preview</CardTitle>
          <CardDescription>
            This is the PDF that gets "parsed" by the AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border p-6 bg-white text-black">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1A2B32]">NexGen Digital Studio</h2>
                <p className="text-sm text-gray-600">1247 Innovation Drive, Suite 400</p>
                <p className="text-sm text-gray-600">San Francisco, CA 94107</p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold text-[#1A2B32]">INVOICE</h3>
                <p className="text-[#D2B4FA] font-semibold">#INV-2025-0147</p>
                <p className="text-sm text-gray-600">Due: January 15, 2025</p>
              </div>
            </div>

            <div className="border-t-2 border-[#D2B4FA] pt-4 mb-4">
              <p className="text-sm text-gray-500 uppercase">Bill To</p>
              <p className="font-semibold">Marcus Thompson</p>
              <p className="text-sm text-gray-600">Thompson & Associates LLC</p>
              <p className="text-sm text-[#D2B4FA]">{debtorEmail || "marcus.thompson@thompsonassoc.com"}</p>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-[#1A2B32] text-white">
                  <th className="text-left p-2">Description</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Brand Identity Design Package</td><td className="text-right p-2">$3,500</td></tr>
                <tr className="border-b"><td className="p-2">Website UI/UX Design (8 pages)</td><td className="text-right p-2">$3,600</td></tr>
                <tr className="border-b"><td className="p-2">Motion Graphics Package</td><td className="text-right p-2">$1,200</td></tr>
                <tr className="border-b"><td className="p-2">Rush Delivery Fee</td><td className="text-right p-2">$850</td></tr>
              </tbody>
            </table>

            <div className="text-right">
              <p className="text-sm text-gray-600">Subtotal: $9,150</p>
              <p className="text-sm text-gray-600">Deposit Paid: -$2,000</p>
              <p className="text-sm text-gray-600">Discount: -$150</p>
              <p className="text-xl font-bold text-[#D2B4FA] mt-2">Amount Due: $7,000</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
