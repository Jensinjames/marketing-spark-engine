
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
    <Card className="surface-elevated">
      <CardHeader>
        <CardTitle className="text-primary">Billing History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-primary">Date</th>
                <th className="text-left py-3 px-4 font-medium text-primary">Description</th>
                <th className="text-left py-3 px-4 font-medium text-primary">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-primary">Status</th>
                <th className="text-left py-3 px-4 font-medium text-primary">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-border hover:bg-surface-elevated-2 transition-colors">
                  <td className="py-3 px-4 text-primary">{transaction.date}</td>
                  <td className="py-3 px-4 text-secondary">{transaction.description}</td>
                  <td className="py-3 px-4 font-medium text-primary">{transaction.amount}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success border border-success/30">
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" className="text-tertiary hover:text-primary">
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
