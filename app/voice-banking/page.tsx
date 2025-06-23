"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, VolumeX, ArrowLeft, Loader2, Ear } from "lucide-react"
import Link from "next/link"

interface VoiceCommand {
  command: string
  response: string
  action?: string
}

const voiceCommands: VoiceCommand[] = [
  { command: "check balance", response: "Your current balance is $2,847.32", action: "balance" },
  { command: "show balance", response: "Your current balance is $2,847.32", action: "balance" },
  { command: "account balance", response: "Your current balance is $2,847.32", action: "balance" },
  { command: "balance", response: "Your current balance is $2,847.32", action: "balance" },
  { command: "money", response: "Your current balance is $2,847.32", action: "balance" },
  {
    command: "recent transactions",
    response: "Your last transaction was a $45.67 payment to Metro Grocery on December 20th",
    action: "transactions",
  },
  {
    command: "transactions",
    response: "Your last transaction was a $45.67 payment to Metro Grocery on December 20th",
    action: "transactions",
  },
  {
    command: "history",
    response: "Your last transaction was a $45.67 payment to Metro Grocery on December 20th",
    action: "transactions",
  },
  {
    command: "transfer money",
    response: "I can help you transfer money. Please specify the amount and recipient.",
    action: "transfer",
  },
  {
    command: "transfer",
    response: "I can help you transfer money. Please specify the amount and recipient.",
    action: "transfer",
  },
  {
    command: "send money",
    response: "I can help you transfer money. Please specify the amount and recipient.",
    action: "transfer",
  },
  {
    command: "pay bills",
    response: "You have 2 pending bills: Electric bill $89.45 and Internet $59.99",
    action: "bills",
  },
  {
    command: "bills",
    response: "You have 2 pending bills: Electric bill $89.45 and Internet $59.99",
    action: "bills",
  },
  {
    command: "emergency lock",
    response: "Emergency lock activated! Your account has been secured immediately.",
    action: "emergency",
  },
  {
    command: "lock account",
    response: "Emergency lock activated! Your account has been secured immediately.",
    action: "emergency",
  },
  {
    command: "emergency",
    response: "Emergency lock activated! Your account has been secured immediately.",
    action: "emergency",
  },
  {
    command: "help",
    response: "I can help you with: check balance, recent transactions, transfer money, pay bills, or emergency lock.",
    action: "help",
  },
]

// Make wake words completely lowercase
const wakeWords = ["hey bank", "hello bank", "bank assistant", "hey banking", "hello banking"]

export default function VoiceBankingPage() {
  const [isListening, setIsListening] = useState(false)
  const [isAwake, setIsAwake] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [autoListening, setAutoListening] = useState(true)
  const [debugInfo, setDebugInfo] = useState("")
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          const fullTranscript = (finalTranscript || interimTranscript).toLowerCase().trim()
          setTranscript(fullTranscript)
          setDebugInfo(`Raw: "${fullTranscript}"`)

          if (finalTranscript) {
            const cleanTranscript = finalTranscript.toLowerCase().trim()
            setDebugInfo(`Processing: "${cleanTranscript}"`)
            processVoiceInput(cleanTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setDebugInfo(`Error: ${event.error}`)
          if (event.error === "not-allowed") {
            alert("Microphone access denied. Please enable microphone permissions for voice banking.")
          }
          // Restart listening after error
          setTimeout(() => {
            if (autoListening && speechSupported) {
              startContinuousListening()
            }
          }, 1000)
        }

        recognitionRef.current.onend = () => {
          // Restart listening automatically
          if (autoListening && speechSupported) {
            setTimeout(() => {
              startContinuousListening()
            }, 100)
          }
        }

        // Start listening immediately
        if (autoListening) {
          startContinuousListening()
        }
      }
    }

    // Announce the service is ready
    setTimeout(() => {
      speakResponse("Voice banking is ready. Say hey bank followed by your command.")
    }, 1000)

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startContinuousListening = () => {
    if (recognitionRef.current && speechSupported && !isListening) {
      try {
        setIsListening(true)
        recognitionRef.current.start()
      } catch (error) {
        console.error("Error starting recognition:", error)
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      setAutoListening(false)
    }
  }

  const resumeListening = () => {
    setAutoListening(true)
    startContinuousListening()
  }

  const processVoiceInput = (input: string) => {
    // Ensure everything is lowercase
    const cleanInput = input.toLowerCase().trim()
    console.log("Processing voice input:", cleanInput)
    setDebugInfo(`Input: "${cleanInput}"`)

    // Check for wake words with more flexible matching
    let hasWakeWord = false
    let foundWakeWord = ""

    for (const wake of wakeWords) {
      if (cleanInput.includes(wake.toLowerCase())) {
        hasWakeWord = true
        foundWakeWord = wake
        break
      }
    }

    setDebugInfo(`Wake word found: ${hasWakeWord ? foundWakeWord : "none"}`)

    if (hasWakeWord || isAwake) {
      setIsAwake(true)
      setTranscript(cleanInput)

      // Extract command after wake word
      let command = cleanInput
      if (hasWakeWord) {
        // Remove the wake word and clean up
        command = cleanInput.replace(foundWakeWord.toLowerCase(), "").trim()
        // Remove common filler words
        command = command.replace(/^(please|can you|could you|i want to|i need to|help me)/, "").trim()
      }

      console.log("Extracted command:", command)
      setDebugInfo(`Command: "${command}"`)

      if (command && command.length > 0) {
        processVoiceCommand(command)
      } else if (hasWakeWord) {
        speakResponse("I'm listening. What would you like me to help you with?")
      }

      // Reset wake state after 15 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsAwake(false)
        setTranscript("")
        setResponse("")
        setDebugInfo("")
      }, 15000)
    }
  }

  const processVoiceCommand = (command: string) => {
    const cleanCommand = command.toLowerCase().trim()
    console.log("Processing command:", cleanCommand)
    setDebugInfo(`Matching: "${cleanCommand}"`)
    setIsProcessing(true)

    // Simulate processing delay
    setTimeout(() => {
      let matchedCommand = null

      // Try direct keyword matching first
      if (cleanCommand.includes("balance") || cleanCommand.includes("money")) {
        matchedCommand = voiceCommands.find((cmd) => cmd.action === "balance")
      } else if (cleanCommand.includes("transaction") || cleanCommand.includes("history")) {
        matchedCommand = voiceCommands.find((cmd) => cmd.action === "transactions")
      } else if (cleanCommand.includes("transfer") || cleanCommand.includes("send")) {
        matchedCommand = voiceCommands.find((cmd) => cmd.action === "transfer")
      } else if (cleanCommand.includes("bill") || cleanCommand.includes("pay")) {
        matchedCommand = voiceCommands.find((cmd) => cmd.action === "bills")
      } else if (cleanCommand.includes("help") || cleanCommand.includes("what can you do")) {
        matchedCommand = voiceCommands.find((cmd) => cmd.action === "help")
      } else if (cleanCommand.includes("emergency") || cleanCommand.includes("lock")) {
        matchedCommand = voiceCommands.find((cmd) => cmd.action === "emergency")
      } else {
        // Try exact command matching as fallback
        matchedCommand = voiceCommands.find(
          (cmd) => cleanCommand.includes(cmd.command.toLowerCase()) || cmd.command.toLowerCase().includes(cleanCommand),
        )
      }

      console.log("Matched command:", matchedCommand)
      setDebugInfo(`Matched: ${matchedCommand ? matchedCommand.action : "none"}`)

      const responseText = matchedCommand
        ? matchedCommand.response
        : `I heard "${cleanCommand}" but didn't understand. Try saying: balance, transactions, transfer, bills, or help.`

      setResponse(responseText)
      speakResponse(responseText)
      setIsProcessing(false)

      // Special handling for emergency
      if (matchedCommand?.action === "emergency") {
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
      }
    }, 800)
  }

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
      }

      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                <h1 className="text-2xl font-bold text-gray-900">Voice Banking</h1>
                <p className="text-sm text-gray-600">Always listening - just say "hey bank" to start</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={speechSupported ? "default" : "destructive"}>
                {speechSupported ? "Voice Ready" : "Voice Not Supported"}
              </Badge>
              <Badge variant={isListening ? "default" : "secondary"}>{isListening ? "Listening" : "Paused"}</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Voice Interface */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Always-On Voice Assistant</CardTitle>
            <CardDescription className="text-lg">
              No buttons needed - just say "hey bank" followed by your request
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* Listening Indicator */}
            <div className="flex justify-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isAwake ? "bg-green-500 animate-pulse" : isListening ? "bg-blue-500 animate-pulse" : "bg-gray-400"
                }`}
              >
                {isAwake ? <Ear className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              {isAwake && (
                <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                  Awake - Listening for commands
                </Badge>
              )}
              {isListening && !isAwake && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Listening for "hey bank"...
                </Badge>
              )}
              {isProcessing && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </Badge>
              )}
              {isSpeaking && (
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    Speaking...
                  </Badge>
                  <Button variant="outline" size="sm" onClick={stopSpeaking}>
                    <VolumeX className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Debug:</strong> {debugInfo}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {autoListening ? (
                <Button onClick={stopListening} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <Mic className="w-4 h-4 mr-2" />
                  Pause Listening
                </Button>
              ) : (
                <Button onClick={resumeListening} className="bg-blue-600 hover:bg-blue-700">
                  <Mic className="w-4 h-4 mr-2" />
                  Resume Listening
                </Button>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-blue-800">
                    <strong>You said:</strong> "{transcript}"
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Response */}
            {response && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4 flex items-start space-x-3">
                  <Volume2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-green-800">
                    <strong>Assistant:</strong> {response}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Simple Commands */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Simple Commands</CardTitle>
            <CardDescription>Try these simple phrases after saying "hey bank":</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">"hey bank balance"</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">"hey bank transactions"</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">"hey bank transfer"</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">"hey bank help"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Commands */}
        <Card>
          <CardHeader>
            <CardTitle>All Available Commands</CardTitle>
            <CardDescription>Complete list of voice commands:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {voiceCommands.slice(0, 8).map((cmd, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">"hey bank {cmd.command}"</p>
                  <p className="text-sm text-gray-600 mt-1">{cmd.response}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
