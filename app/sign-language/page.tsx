"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, ArrowLeft, Hand, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";

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
  const [cameraSupported, setCameraSupported] = useState(true);
  const [detectedGesture, setDetectedGesture] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0)
  const [response, setResponse] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [handDetected, setHandDetected] = useState(false)
  const [fingerCount, setFingerCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const createHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setHandLandmarker(landmarker);
        setIsLoading(false);
      } catch (error) {
        console.error("Error creating HandLandmarker:", error);
        setCameraSupported(false);
        setIsLoading(false);
      }
    };
    createHandLandmarker();

    return () => {
        // Cleanup on component unmount
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }
  }, []);

  const startCamera = async () => {
    if (!handLandmarker) return;
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", predictWebcam);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
      setIsCameraActive(false);
      if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      const canvasCtx = canvasRef.current?.getContext("2d");
      if (canvasCtx) {
          canvasCtx.clearRect(0,0, canvasRef.current!.width, canvasRef.current!.height);
      }
      setDetectedGesture("");
      setConfidence(0);
      setHandDetected(false);
      setFingerCount(0);
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    if (!video || !handLandmarker) return;

    if (video.paused || video.ended) {
        return;
    }
    
    let startTimeMs = performance.now();
    const results = handLandmarker.detectForVideo(video, startTimeMs);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    if (results.landmarks && results.landmarks.length > 0) {
        setHandDetected(true);
        const landmarks = results.landmarks[0];

        drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1, radius: 3 });
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });

        const fingers = countFingers(landmarks);
        setFingerCount(fingers);

        const gesture = detectGesture(landmarks, fingers);
        if (gesture.name && gesture.confidence > 0.7) {
            setDetectedGesture(gesture.name);
            setConfidence(gesture.confidence);

            if (gesture.confidence > 0.85) {
                const command = gestureCommands.find((cmd) => cmd.gesture === gesture.name);
                if (command) processGestureCommand(command);
            }
        } else {
            if (confidence > 0) setConfidence(Math.max(0, confidence - 0.1));
            if (confidence < 0.3) setDetectedGesture("");
        }
    } else {
        setHandDetected(false);
        setFingerCount(0);
        setDetectedGesture("");
        setConfidence(0);
    }
    canvasCtx.restore();

    if (isCameraActive) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
    }
  };

  const countFingers = (landmarks: any[]) => {
    // ... (Your finger counting logic here - it should work as is)
    if (!landmarks || landmarks.length < 21) return 0;
    let fingers = 0;
    const tipIds = [4, 8, 12, 16, 20];
    // Thumb
    if (landmarks[tipIds[0]].x < landmarks[tipIds[0] - 1].x) fingers++;
    // 4 Fingers
    for (let i = 1; i < 5; i++) {
        if (landmarks[tipIds[i]].y < landmarks[tipIds[i] - 2].y) fingers++;
    }
    return fingers;
  };

  const detectGesture = (landmarks: any[], fingerCount: number) => {
    // ... (Your gesture detection logic here - it should work as is)
     if (!landmarks || landmarks.length < 21) return { name: "", confidence: 0 };
    let gestureName = "";
    let confidence = 0;
    switch (fingerCount) {
        case 0: gestureName = "Closed Fist"; confidence = 0.9; break;
        case 1:
            if (landmarks[4].y < landmarks[3].y && landmarks[8].y > landmarks[6].y) {
                gestureName = "Thumbs Up";
                confidence = 0.85;
            } else if (landmarks[8].y < landmarks[6].y) {
                gestureName = "One Finger";
                confidence = 0.8;
            }
            break;
        case 2: gestureName = "Two Fingers"; confidence = 0.8; break;
        case 3: gestureName = "Three Fingers"; confidence = 0.8; break;
        case 5: gestureName = "Open Palm"; confidence = 0.9; break;
        default: gestureName = ""; confidence = 0;
    }
    return { name: gestureName, confidence };
  };

  const processGestureCommand = (command: GestureCommand) => {
    // ... (Your command processing logic here - it should work as is)
    if (isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
        let responseText = "";
        switch (command.action) {
            case "balance": responseText = "Your account balance is $2,847.32"; break;
            case "transactions": responseText = "Last transaction: $45.67 at Metro Grocery"; break;
            case "transfer": responseText = "Transfer mode activated. Show amount with fingers."; break;
            case "confirm": responseText = "Action confirmed successfully!"; break;
            case "emergency": responseText = "EMERGENCY: Account locked immediately!"; break;
            case "help": responseText = "Showing gesture commands menu"; break;
            default: responseText = "Gesture recognized but no action assigned";
        }
        setResponse(responseText);
        setIsProcessing(false);
        if ("vibrate" in navigator) {
            if (command.action === "emergency") navigator.vibrate([200, 100, 200, 100, 200]);
            else navigator.vibrate([100, 50, 100]);
        }
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(responseText);
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
        setTimeout(() => setResponse(""), 5000);
    }, 1000);
  };

  return (
    // ... (Your JSX for the page UI here - it should work as is)
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
              <Badge variant={!isLoading ? "default" : "secondary"}>
                {isLoading ? "Loading AI..." : "AI Ready"}
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
                 Using MediaPipe for accurate hand tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Feed */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scaleX(-1)" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform scaleX(-1)" />

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
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>MediaPipe AI hand tracking</span>
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
