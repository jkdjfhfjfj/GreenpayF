import React, { useState, useEffect } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BILL_PROVIDERS = [
  { value: "KPLC", label: "KPLC (Electricity)" },
  { value: "Zuku", label: "Zuku (Cable TV)" },
  { value: "StarimesTV", label: "Starimes TV (Cable)" },
  { value: "Nairobi_Water", label: "Nairobi Water (Water)" },
  { value: "Kenya_Power", label: "Kenya Power" },
  { value: "Airtel_Money", label: "Airtel Money" },
];

interface BillPayment {
  id: string;
  provider: string;
  meterNumber?: string;
  accountNumber?: string;
  amount: string;
  status: string;
  createdAt: string;
}

export default function BillsPage() {
  const { user } = useAuth();
  const [navigate] = useNavigate();
  const [provider, setProvider] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [billHistory, setBillHistory] = useState<BillPayment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchBillHistory();
    }
  }, [user]);

  const fetchBillHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/bills/history/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setBillHistory(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching bill history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provider || !amount || (!meterNumber && !accountNumber)) {
      setMessage("Please fill in all required fields");
      setMessageType("error");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          provider,
          meterNumber: meterNumber || null,
          accountNumber: accountNumber || null,
          amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Bill payment successful!");
        setMessageType("success");
        setProvider("");
        setMeterNumber("");
        setAccountNumber("");
        setAmount("");
        
        setTimeout(() => {
          fetchBillHistory();
          setMessage("");
        }, 2000);
      } else {
        setMessage(data.message || "Error processing bill payment");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error processing bill payment");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const needsMeterNumber = ["KPLC", "Kenya_Power", "Nairobi_Water"].includes(provider);
  const needsAccountNumber = ["Zuku", "StarimesTV", "Airtel_Money"].includes(provider);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pay Bills</h1>
          <p className="text-gray-600">Pay electricity, water, cable, and other bills instantly</p>
        </div>

        <div className="grid gap-6">
          {/* Payment Form */}
          <Card className="p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">New Bill Payment</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Provider
                </label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsMeterNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meter Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter meter number"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                  />
                </div>
              )}

              {needsAccountNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KES)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${
                  messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {messageType === "success" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                {loading ? "Processing..." : "Pay Bill"}
              </Button>
            </form>
          </Card>

          {/* Bill History */}
          <Card className="p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recent Payments</h2>

            {loadingHistory ? (
              <div className="text-center text-gray-600">Loading...</div>
            ) : billHistory.length === 0 ? (
              <div className="text-center text-gray-600">No bill payments yet</div>
            ) : (
              <div className="space-y-3">
                {billHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {payment.status === "completed" ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <Clock className="text-yellow-600" size={20} />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{payment.provider}</p>
                        <p className="text-sm text-gray-600">
                          {payment.meterNumber || payment.accountNumber || "Bill"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">KES {payment.amount}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
