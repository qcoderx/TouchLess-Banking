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
  { gesture: "Thumbs Up", description: "Confirm action", action: "confirm" },
  { gesture: "Closed Fist", description: "Emergency lock account", action: "emergency", fingerCount: 0 },
  { gesture: "Three Fingers", description: "Help menu", action: "help", fingerCount: 3 },
]

export default function SignLanguagePage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [detectedGesture, setDetectedGesture] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [response, setResponse] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [fingerCount, setFingerCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // Initialize the HandLandmarker model
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
      } catch (error) {
        console.error("Error creating HandLandmarker:", error);
        setCameraSupported(false);
      } finally {
        setIsLoading(false);
      }
    };
    if (typeof window !== "undefined") {
      createHandLandmarker();
    }
  }, []);

  // Effect to manage the prediction loop
  useEffect(() => {
    let lastVideoTime = -1;
    const predict = () => {
      const video = videoRef.current;
      if (!isCameraActive || !video || !handLandmarker || video.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(predict);
        return;
      }

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, Date.now());
        
        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext("2d");
        if (canvas && canvasCtx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const drawingUtils = new DrawingUtils(canvasCtx);
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
              setHandDetected(true);
              for (const landmarks of results.landmarks) {
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 3 });
                drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2, radius: 3 });
              }
              const handedness = results.handednesses[0][0].categoryName as 'Left' | 'Right';
              const landmarks = results.landmarks[0];
              const fingers = countFingers(landmarks, handedness);
              setFingerCount(fingers);

              const gesture = detectGesture(landmarks, fingers);
              if (gesture.name && gesture.confidence > 0.85) {
                if (gesture.name !== detectedGesture) {
                  setDetectedGesture(gesture.name);
                  setConfidence(gesture.confidence);
                  const command = gestureCommands.find((cmd) => cmd.gesture === gesture.name);
                  if (command) processGestureCommand(command);
                }
              } else {
                if (detectedGesture) setDetectedGesture("");
              }
            } else {
              setHandDetected(false);
            }
            canvasCtx.restore();
        }
      }
      animationFrameId.current = requestAnimationFrame(predict);
    };

    if (isCameraActive) {
      animationFrameId.current = requestAnimationFrame(predict);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, handLandmarker, detectedGesture]); // Rerun effect when camera or model changes


  const startCamera = async () => {
    if (isCameraActive || isLoading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (!isCameraActive) return;
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setDetectedGesture("");
    setHandDetected(false);
  };
  
  const countFingers = (landmarks: any[], handedness: 'Left' | 'Right') => {
    if (!landmarks || landmarks.length < 21) return 0;
    
    let fingers = 0;
    const tipIds = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
    const pipIds = [3, 6, 10, 14, 18]; // IP for thumb, PIP for others

    // For a mirrored view, user's right hand is detected as 'Left'
    if (handedness === 'Left') {
      if (landmarks[tipIds[0]].x < landmarks[pipIds[0]].x) fingers++; // Right hand thumb
    } else {
      if (landmarks[tipIds[0]].x > landmarks[pipIds[0]].x) fingers++; // Left hand thumb
    }
    
    // Other 4 fingers
    for (let i = 1; i < 5; i++) {
        if (landmarks[tipIds[i]].y < landmarks[pipIds[i]].y) {
            fingers++;
        }
    }
    return fingers;
  };

  const detectGesture = (landmarks: any[], fingerCount: number) => {
    if (!landmarks || landmarks.length < 21) return { name: "", confidence: 0 };
    
    let gestureName = "";
    let confidence = 0.9;

    // A more reliable Thumbs Up gesture check
    const thumbTip = landmarks[4];
    const indexPip = landmarks[6];
    const pinkyMcp = landmarks[17];
    if (fingerCount === 1 && thumbTip.y < indexPip.y && thumbTip.y < pinkyMcp.y) {
        return { name: "Thumbs Up", confidence: 0.95 };
    }

    switch (fingerCount) {
        case 0: gestureName = "Closed Fist"; break;
        case 1: gestureName = "One Finger"; break;
        case 2: gestureName = "Two Fingers"; break;
        case 3: gestureName = "Three Fingers"; break;
        case 5: gestureName = "Open Palm"; break;
    }
    
    return { name: gestureName, confidence };
  };

  const processGestureCommand = (command: GestureCommand) => {
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

      if (typeof window !== "undefined" && 'vibrate' in navigator) {
        if (command.action === "emergency") navigator.vibrate([200, 100, 200]);
        else navigator.vibrate(100);
      }

      if (typeof window !== "undefined" && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }

      setTimeout(() => setResponse(""), 4000);
    }, 500);
  };
  
  // The rest of the return statement (JSX) is the same as before
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
                {cameraSupported ? "Camera Ready" : "Not Supported"}
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
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform -scale-x-100" />
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                          <p className="text-lg">Loading AI models...</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Camera is off</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={isCameraActive ? stopCamera : startCamera}
                  disabled={!cameraSupported || isLoading}
                  className={isCameraActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {isCameraActive ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                  {isCameraActive ? "Stop Camera" : "Start Camera"}
                </Button>
              </div>
              {isCameraActive && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Detection Status:</span>
                    <Badge variant={handDetected ? "default" : "secondary"}>
                      {handDetected ? `Hand Detected (${fingerCount} fingers)` : "No Hand Detected"}
                    </Badge>
                  </div>
                   {detectedGesture && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Recognized Gesture:</span>
                        <Badge variant="default" className="bg-blue-600">
                           {detectedGesture} ({(confidence * 100).toFixed(0)}%)
                        </Badge>
                    </div>
                   )}
                </div>
              )}
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
                        detectedGesture === cmd.gesture ? "border-green-400 bg-green-50 shadow-md" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Hand className="w-5 h-5 text-blue-600"/>
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
                     <Hand className="w-6 h-6 text-red-700"/>
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Closed Fist</p>
                    <p className="text-sm text-red-700">
                      Make a fist to immediately lock your account in case of emergency.
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

