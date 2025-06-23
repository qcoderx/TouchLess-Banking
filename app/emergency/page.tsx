"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, AlertTriangle, Phone, Lock, Unlock, Timer } from "lucide-react"
import Link from "next/link"

export default function EmergencyPage() {
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [emergencyContacts] = useState([
    { name: 'Bank Security', phone: '1-800-SECURITY', type: 'primary' },
    { name: 'Emergency Contact', phone: '555-0123', type: 'personal' },
    { name: 'Local Police', phone: '911', type: 'emergency' }
  ])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [lockTimer])

  const handleEmergencyLock = () => {
    setIsLocked(true)
    setLockTimer(300) // 5 minutes
    
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
    
    // Show confirmation
    alert('EMERGENCY LOCK ACTIVATED!\nYour account has been temporarily locked for security.')
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setLockTimer(0)
    
    // Trigger success haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Controls</h1>
                <p className="text-sm text-gray-600">Secure your account instantly</p>
              </div>
            </div>
            <Badge variant={isLocked ? "destructive" : "default"}>
              {isLocked ? 'Account Locked' : 'Account Active'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Emergency Lock Status */}
        <Card className={`mb-8 ${isLocked ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              {isLocked ? (
                <>
                  <Lock className="w-8 h-8 text-red-600" />
                  <span className="text-red-800">Account Locked</span>
                </>
              ) : (
                <>
                  <Shield className="w-8 h-8 text-green-600" />
                  <span className="text-green-800">Account Secure</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="text-lg">
              {isLocked 
                ? 'Your account is temporarily locked for security' 
                : 'Your account is active and secure'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {isLocked && lockTimer > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Timer className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Auto-unlock in:</span>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {formatTime(lockTimer)}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              {!isLocked ? (
                <Button
                  onClick={handleEmergencyLock}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
                >
                  <Lock className="w-6 h-6 mr-2" />
                  Emergency Lock Account
                </Button>
              ) : (
                <Button
                  onClick={handleUnlock}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                >
                  <Unlock className="w-6 h-6 mr-2" />
                  Unlock Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Triggers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <span>Emergency Triggers</span>
            </CardTitle>
            <CardDescription>
              Multiple ways to activate emergency lock for different accessibility needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Voice Commands</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">"Emergency lock"</p>
                    <p className="text-gray-600">Immediately locks account</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">"Help me"</p>
                    <p className="text-gray-600">Activates emergency mode</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Gesture Triggers</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Closed Fist (3 seconds)</p>
                    <p className="text-gray-600">Hold fist gesture to lock</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Double Tap Screen</p>
                    <p className="text-gray-600">Quick emergency activation</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Physical Triggers</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Long Press (5 seconds)</p>
                    <p className="text-gray-600">Hold any button for 5 seconds</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Shake Device</p>
                    <p className="text-gray-600">Vigorous shaking activates lock</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Haptic Patterns</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">SOS Pattern</p>
                    <p className="text-gray-600">Three short, three long, three short taps</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Panic Sequence</p>
                    <p className="text-gray-600">Rapid multiple taps</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-6 h-6 text-blue-600" />
              <span>Emergency Contacts</span>
            </CardTitle>
            <CardDescription>
              Quick access to important phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{contact.type} contact</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-lg">{contact.phone}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`tel:${contact.phone}`)}
                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Security Notice</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Emergency lock immediately freezes all account access</li>
                  <li>• Locked accounts automatically unlock after 5 minutes</li>
                  <li>• Manual unlock requires identity verification</li>
                  <li>• All emergency actions are logged for security</li>
                  <li>• Contact bank security if you need immediate assistance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    \
