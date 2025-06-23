"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Camera, Vibrate, Wifi, Shield, Volume2, Eye, Hand } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Hand className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TouchlessBank</h1>
                <p className="text-sm text-gray-600">Accessible Banking for Everyone</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
                <Wifi className="w-3 h-3" />
                <span>{isOnline ? "Online" : "Offline"}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Banking Made Accessible</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience banking through voice commands, sign language, and haptic feedback. Designed for users with
            visual, hearing, and mobility impairments.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/voice-banking">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Volume2 className="w-5 h-5 mr-2" />
                Voice Banking
              </Button>
            </Link>
            <Link href="/sign-language">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                <Camera className="w-5 h-5 mr-2" />
                Sign Language UI
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="w-6 h-6 text-blue-600" />
                <span>Voice Assistant</span>
              </CardTitle>
              <CardDescription>Complete banking through voice commands with offline support</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Speech-to-text banking</li>
                <li>• Text-to-speech responses</li>
                <li>• Works offline</li>
                <li>• Natural language processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hand className="w-6 h-6 text-green-600" />
                <span>Sign Language UI</span>
              </CardTitle>
              <CardDescription>ASL and gesture recognition for banking operations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Real-time ASL detection</li>
                <li>• Gesture-based navigation</li>
                <li>• Visual feedback system</li>
                <li>• Braille gesture support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Vibrate className="w-6 h-6 text-purple-600" />
                <span>Haptic Navigation</span>
              </CardTitle>
              <CardDescription>Tactile feedback for deaf-blind users</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Vibration patterns</li>
                <li>• Touch-based navigation</li>
                <li>• Haptic confirmations</li>
                <li>• Emergency vibration alerts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-6 h-6 text-orange-600" />
                <span>Low-Bandwidth PWA</span>
              </CardTitle>
              <CardDescription>Works in rural and low-connectivity areas</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Offline functionality</li>
                <li>• Data compression</li>
                <li>• Progressive loading</li>
                <li>• Cache-first strategy</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-red-600" />
                <span>Emergency Features</span>
              </CardTitle>
              <CardDescription>Panic triggers and security measures</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Gesture panic trigger</li>
                <li>• Long-press lockout</li>
                <li>• Emergency contacts</li>
                <li>• Instant account freeze</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-6 h-6 text-indigo-600" />
                <span>Universal Access</span>
              </CardTitle>
              <CardDescription>Designed for all accessibility needs</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Screen reader compatible</li>
                <li>• High contrast modes</li>
                <li>• Keyboard navigation</li>
                <li>• Customizable UI</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Access</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/voice-banking">
              <Button
                variant="outline"
                className="w-full h-16 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <div className="text-center">
                  <Mic className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Voice Banking</div>
                </div>
              </Button>
            </Link>
            <Link href="/sign-language">
              <Button
                variant="outline"
                className="w-full h-16 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <div className="text-center">
                  <Camera className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Sign Language</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="w-full h-16 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
              >
                <div className="text-center">
                  <Eye className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Dashboard</div>
                </div>
              </Button>
            </Link>
            <Link href="/emergency">
              <Button variant="outline" className="w-full h-16 bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">Emergency</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
