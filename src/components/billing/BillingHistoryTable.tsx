
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const BillingHistoryTable = () => {
  const transactions = [
    {
      id: "inv_001",
      date: "Dec 1, 2024",
      description: "Pro Plan - Monthly",
      amount: "$29.00",
      status: "Paid"
    },
    {
      id: "inv_002",
      date: "Nov 1, 2024",
      description: "Pro Plan - Monthly",
      amount: "$29.00",
      status: "Paid"
    },
    {
      id: "inv_003",
      date: "Oct 1, 2024",
      description: "Starter Plan - Monthly",
      amount: "$0.00",
      status: "Paid"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td className="py-3 px-4 text-gray-900">{transaction.date}</td>
                  <td className="py-3 px-4 text-gray-600">{transaction.description}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{transaction.amount}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingHistoryTable;
