"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, CreditCard, Shield, Bell } from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: "debit" | "credit"
  category: string
}

const mockTransactions: Transaction[] = [
  { id: "1", description: "Metro Grocery", amount: -45.67, date: "2024-12-20", type: "debit", category: "Food" },
  { id: "2", description: "Salary Deposit", amount: 3200.0, date: "2024-12-19", type: "credit", category: "Income" },
  { id: "3", description: "Electric Bill", amount: -89.45, date: "2024-12-18", type: "debit", category: "Utilities" },
  { id: "4", description: "Coffee Shop", amount: -12.5, date: "2024-12-17", type: "debit", category: "Food" },
  { id: "5", description: "ATM Withdrawal", amount: -100.0, date: "2024-12-16", type: "debit", category: "Cash" },
]

export default function DashboardPage() {
  const [selectedAccount, setSelectedAccount] = useState("checking")

  const balance = 2847.32
  const monthlyIncome = 3200.0
  const monthlyExpenses = 1456.78

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Dashboard</h1>
                <p className="text-sm text-gray-600">Accessible banking overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Balance */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <span>Account Balance</span>
              </CardTitle>
              <CardDescription>Current balance in your checking account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-4">
                ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Available Balance
                </Badge>
                <span className="text-sm text-gray-600">Last updated: Just now</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/voice-banking">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  Voice Banking
                </Button>
              </Link>
              <Link href="/sign-language">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  Sign Language
                </Button>
              </Link>
              <Link href="/emergency">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                >
                  Emergency Lock
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Monthly Income</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-gray-600 mt-2">December 2024</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span>Monthly Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -${monthlyExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-gray-600 mt-2">December 2024</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "credit" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {transaction.type === "credit" ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.category} • {transaction.date}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.type === "credit" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "credit" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Accessibility Features Status</CardTitle>
            <CardDescription>Current status of your accessibility preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900">Voice Banking</p>
                  <p className="text-sm text-green-700">Active</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900">Sign Language</p>
                  <p className="text-sm text-green-700">Ready</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900">Haptic Feedback</p>
                  <p className="text-sm text-green-700">Enabled</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900">Screen Reader</p>
                  <p className="text-sm text-green-700">Compatible</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
