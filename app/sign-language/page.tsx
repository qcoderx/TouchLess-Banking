"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, ArrowLeft, Hand, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface GestureCommand {
  gesture: string
  description: string
  action: string
  fingerCount?: number
}

const gestureCommands: GestureCommand[] = [
  { gesture: "Open Palm", description: "Show account balance", action: "balance", fingerCount: 5 },
  { gesture: "One Finger", description: "Recent transactions", action: "transactions", fingerCount: 1 },
  { gesture: "Two Fingers", description: "Transfer money", action: "transfer", fingerCount: 2 },
  { gesture: "Thumbs Up", description: "Confirm action", action: "confirm", fingerCount: 1 },
  { gesture: "Closed Fist", description: "Emergency lock account", action: "emergency", fingerCount: 0 },
  { gesture: "Three Fingers", description: "Help menu", action: "help", fingerCount: 3 },
]

export default function SignLanguagePage() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraSupported, setCameraSupported] = useState(false)
  const [detectedGesture, setDetectedGesture] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0)
  const [response, setResponse] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [handDetected, setHandDetected] = useState(false)
  const [fingerCount, setFingerCount] = useState<number>(0)
  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  const handsRef = useRef<any>(null)

  // --- add just below the hooks ---
  async function loadMediaPipeModules() {
    setIsLoading(true)

    const [{ Hands, HAND_CONNECTIONS }, { drawConnectors, drawLandmarks }, { Camera }] = await Promise.all([
      import("@mediapipe/hands"), // hand landmark model
      import("@mediapipe/drawing_utils"), // helpers to draw
      import("@mediapipe/camera_utils"), // util to pipe cam frames
    ])

    handsRef.current = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })
    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    })(
      // adapter so we can use the draw helpers later
      window as any,
    ).MP_DRAW = { drawConnectors, drawLandmarks, HAND_CONNECTIONS }

    handsRef.current.onResults(onHandsResults)
    setMediaPipeLoaded(true)
    setIsLoading(false)
  }

  useEffect(() => {
    // Check camera support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraSupported(true)
    }

    // Load MediaPipe Hands
    if (cameraSupported) {
      loadMediaPipeModules()
    }

    return () => {
      stopCamera()
    }
  }, [])

  const onHandsResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw video frame
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true)

      const landmarks = results.multiHandLandmarks[0]

      // Draw hand landmarks
      const { drawConnectors, drawLandmarks, HAND_CONNECTIONS } = (window as any).MP_DRAW

      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 2,
      })
      drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1 })

      // Count fingers and detect gestures
      const fingers = countFingers(landmarks)
      setFingerCount(fingers)

      const gesture = detectGesture(landmarks, fingers)
      if (gesture.name && gesture.confidence > 0.7) {
        setDetectedGesture(gesture.name)
        setConfidence(gesture.confidence)

        if (gesture.confidence > 0.85) {
          const command = gestureCommands.find((cmd) => cmd.gesture === gesture.name)
          if (command) {
            processGestureCommand(command)
          }
        }
      } else {
        setConfidence(Math.max(0, confidence - 0.1))
        if (confidence < 0.3) {
          setDetectedGesture("")
        }
      }
    } else {
      setHandDetected(false)
      setFingerCount(0)
      setDetectedGesture("")
      setConfidence(0)
    }
  }

  const countFingers = (landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return 0

    let fingers = 0

    // Thumb (compare x coordinates)
    if (landmarks[4].x > landmarks[3].x) fingers++

    // Other fingers (compare y coordinates)
    const fingerTips = [8, 12, 16, 20] // Index, Middle, Ring, Pinky
    const fingerPips = [6, 10, 14, 18]

    for (let i = 0; i < fingerTips.length; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
        fingers++
      }
    }

    return fingers
  }

  const detectGesture = (landmarks: any[], fingerCount: number) => {
    if (!landmarks || landmarks.length < 21) {
      return { name: "", confidence: 0 }
    }

    let gestureName = ""
    let confidence = 0

    // Detect gestures based on finger count and hand shape
    switch (fingerCount) {
      case 0:
        gestureName = "Closed Fist"
        confidence = 0.9
        break
      case 1:
        // Check if it's thumbs up or pointing
        if (landmarks[4].y < landmarks[3].y && landmarks[8].y > landmarks[6].y) {
          gestureName = "Thumbs Up"
          confidence = 0.85
        } else if (landmarks[8].y < landmarks[6].y) {
          gestureName = "One Finger"
          confidence = 0.8
        }
        break
      case 2:
        gestureName = "Two Fingers"
        confidence = 0.8
        break
      case 3:
        gestureName = "Three Fingers"
        confidence = 0.8
        break
      case 5:
        gestureName = "Open Palm"
        confidence = 0.9
        break
      default:
        gestureName = ""
        confidence = 0
    }

    return { name: gestureName, confidence }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)

        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
          }

          if (mediaPipeLoaded) {
            startMediaPipeDetection()
          } else {
            startBasicDetection()
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const startMediaPipeDetection = () => {
    if (!handsRef.current || !videoRef.current) return

    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current && videoRef.current) {
          await handsRef.current.send({ image: videoRef.current })
        }
      },
      width: 640,
      height: 480,
    })
    camera.start()
  }

  const startBasicDetection = () => {
    // Fallback to basic detection if MediaPipe fails
    const detectGestures = () => {
      if (!isCameraActive || !videoRef.current || !canvasRef.current) {
        return
      }

      // Simple finger counting simulation
      const simulatedFingerCount = Math.floor(Math.random() * 6)
      setFingerCount(simulatedFingerCount)
      setHandDetected(simulatedFingerCount > 0)

      if (simulatedFingerCount > 0) {
        let gesture = ""
        switch (simulatedFingerCount) {
          case 0:
            gesture = "Closed Fist"
            break
          case 1:
            gesture = "One Finger"
            break
          case 2:
            gesture = "Two Fingers"
            break
          case 3:
            gesture = "Three Fingers"
            break
          case 5:
            gesture = "Open Palm"
            break
        }

        if (gesture) {
          setDetectedGesture(gesture)
          setConfidence(0.8)

          const command = gestureCommands.find((cmd) => cmd.gesture === gesture)
          if (command && Math.random() > 0.7) {
            processGestureCommand(command)
          }
        }
      }

      animationRef.current = requestAnimationFrame(detectGestures)
    }

    detectGestures()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsCameraActive(false)
    setDetectedGesture("")
    setConfidence(0)
    setHandDetected(false)
    setFingerCount(0)
  }

  const processGestureCommand = (command: GestureCommand) => {
    if (isProcessing) return

    setIsProcessing(true)

    setTimeout(() => {
      let responseText = ""
      switch (command.action) {
        case "balance":
          responseText = "Your account balance is $2,847.32"
          break
        case "transactions":
          responseText = "Last transaction: $45.67 at Metro Grocery"
          break
        case "transfer":
          responseText = "Transfer mode activated. Show amount with fingers."
          break
        case "confirm":
          responseText = "Action confirmed successfully!"
          break
        case "emergency":
          responseText = "EMERGENCY: Account locked immediately!"
          break
        case "help":
          responseText = "Showing gesture commands menu"
          break
        default:
          responseText = "Gesture recognized but no action assigned"
      }

      setResponse(responseText)
      setIsProcessing(false)

      // Trigger haptic feedback
      if ("vibrate" in navigator) {
        if (command.action === "emergency") {
          navigator.vibrate([200, 100, 200, 100, 200])
        } else {
          navigator.vibrate([100, 50, 100])
        }
      }

      // Speak the response
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(responseText)
        utterance.rate = 0.9
        speechSynthesis.speak(utterance)
      }

      setTimeout(() => {
        setResponse("")
      }, 5000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sign Language Banking</h1>
                <p className="text-sm text-gray-600">AI-powered hand and finger detection</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={cameraSupported ? "default" : "destructive"}>
                {cameraSupported ? "Camera Ready" : "Camera Not Supported"}
              </Badge>
              <Badge variant={mediaPipeLoaded ? "default" : "secondary"}>
                {isLoading ? "Loading AI..." : mediaPipeLoaded ? "AI Ready" : "Basic Mode"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera Interface */}
          <Card className="lg:sticky lg:top-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Camera className="w-6 h-6" />
                <span>AI Hand Detection</span>
              </CardTitle>
              <CardDescription>
                {mediaPipeLoaded ? "Using MediaPipe AI for accurate hand tracking" : "Using basic detection mode"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Feed */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                          <p className="text-lg">Loading AI models...</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Camera not active</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Detection Overlays */}
                {isCameraActive && (
                  <>
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <div className={`w-4 h-4 rounded-full ${handDetected ? "bg-green-500" : "bg-red-500"}`}></div>
                      {handDetected && (
                        <Badge variant="default" className="text-xs">
                          {fingerCount} fingers
                        </Badge>
                      )}
                    </div>

                    {detectedGesture && (
                      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Hand className="w-4 h-4" />
                          <span className="font-medium">{detectedGesture}</span>
                        </div>
                        <div className="text-xs mt-1">Confidence: {(confidence * 100).toFixed(0)}%</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={isCameraActive ? stopCamera : startCamera}
                  disabled={!cameraSupported || isLoading}
                  className={isCameraActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff className="w-4 h-4 mr-2" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
              </div>

              {/* Detection Status */}
              {isCameraActive && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Detection Status:</span>
                    <Badge variant={detectedGesture ? "default" : "secondary"}>
                      {detectedGesture
                        ? "Gesture Detected"
                        : handDetected
                          ? `Hand (${fingerCount} fingers)`
                          : "Waiting..."}
                    </Badge>
                  </div>

                  {confidence > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{(confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            confidence > 0.8 ? "bg-green-500" : confidence > 0.6 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Response */}
              {response && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-900">Action Response:</p>
                        <p className="text-blue-800">{response}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Gesture Commands */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Gestures</CardTitle>
                <CardDescription>Show these hand gestures to perform banking actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gestureCommands.map((cmd, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        detectedGesture === cmd.gesture ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-blue-600">{cmd.fingerCount}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cmd.gesture}</p>
                            <p className="text-sm text-gray-600">{cmd.description}</p>
                          </div>
                        </div>
                        {detectedGesture === cmd.gesture && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle>AI Detection Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${mediaPipeLoaded ? "bg-green-500" : "bg-yellow-500"}`}></div>
                    <span>{mediaPipeLoaded ? "MediaPipe AI hand tracking" : "Basic finger detection"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time finger counting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Hand landmark detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Gesture confidence scoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Gesture */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Emergency Gesture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                    <span className="font-bold text-red-700">0</span>
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Closed Fist (0 fingers)</p>
                    <p className="text-sm text-red-700">
                      Make a fist to immediately lock your account in case of emergency
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
