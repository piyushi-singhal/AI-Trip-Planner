"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  SparklesIcon,
  TrainIcon,
  ArrowRightIcon,
  PlayIcon,
  StarIcon,
  UsersIcon,
  TrendingUpIcon,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ScreenTransition } from "@/components/screen-transition"
import { EnhancedLoading } from "@/components/enhanced-loading"
import { EnhancedResults } from "@/components/enhanced-results"
import { exportTextToPDF } from "@/lib/pdf-export"
import { useToast } from "@/hooks/use-toast"

const interests = ["Temples", "Beaches", "Food", "Trekking", "Heritage Sites", "Shopping", "Nightlife", "Festivals"]
const travelStyles = ["Relaxed", "Adventure", "Luxury", "Family", "Backpacker"]
const currencies = [
  { value: "INR", label: "₹ INR" },
  { value: "USD", label: "$ USD" },
]
const travelModes = ["Flight", "Train", "Bus", "Car"]

type Screen = "landing" | "form" | "loading" | "results"

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")
  const [formData, setFormData] = useState({
    destination: [] as string[],
    startDate: "",
    endDate: "",
    budget: "",
    currency: "INR",
    travelStyle: "",
    interests: [] as string[],
    modeOfTravel: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [itinerary, setItinerary] = useState("")
  const [destinationInput, setDestinationInput] = useState("")
  const { toast } = useToast()

  const today = new Date().toISOString().split("T")[0]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minEndDate = tomorrow.toISOString().split("T")[0]

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleAddDestination = () => {
    if (destinationInput.trim() && !formData.destination.includes(destinationInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        destination: [...prev.destination, destinationInput.trim()],
      }))
      setDestinationInput("")
    }
  }

  const handleRemoveDestination = (destinationToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      destination: prev.destination.filter((dest) => dest !== destinationToRemove),
    }))
  }

  const handleDestinationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddDestination()
    }
  }

  const validateForm = () => {
    if (formData.destination.length === 0) {
      toast({
        title: "Destination required",
        description: "Please add at least one destination city.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Dates required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      })
      return false
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      toast({
        title: "Invalid start date",
        description: "Start date cannot be in the past.",
        variant: "destructive",
      })
      return false
    }

    if (endDate <= startDate) {
      toast({
        title: "Invalid end date",
        description: "End date must be after start date.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.budget || Number.parseInt(formData.budget) <= 0) {
      toast({
        title: "Budget required",
        description: "Please enter a valid budget amount.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.travelStyle) {
      toast({
        title: "Travel style required",
        description: "Please select your travel style.",
        variant: "destructive",
      })
      return false
    }

    if (formData.interests.length === 0) {
      toast({
        title: "Interests required",
        description: "Please select at least one interest.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.modeOfTravel) {
      toast({
        title: "Travel mode required",
        description: "Please select your preferred mode of travel.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setCurrentScreen("loading")
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setItinerary(data.itinerary)
      setCurrentScreen("results")

      toast({
        title: "Itinerary generated!",
        description: "Your personalized travel plan is ready.",
      })
    } catch (error) {
      console.error("Error generating itinerary:", error)
      toast({
        title: "Generation failed",
        description: "Unable to generate itinerary. Please try again.",
        variant: "destructive",
      })
      setCurrentScreen("form")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    if (isGenerating) return

    toast({
      title: "Regenerating itinerary...",
      description: "Creating a new personalized travel plan for you.",
    })

    setCurrentScreen("loading")
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setItinerary(data.itinerary)

      toast({
        title: "New itinerary generated!",
        description: "Your fresh travel plan is ready.",
      })
    } catch (error) {
      console.error("Error regenerating itinerary:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    if (!itinerary) {
      toast({
        title: "No itinerary to export",
        description: "Please generate an itinerary first.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Preparing PDF...",
      description: "Your itinerary is being formatted for download.",
    })

    try {
      const filename = `${formData.destination.join("_").toLowerCase()}_itinerary.pdf`
      const success = await exportTextToPDF(itinerary, formData, filename)

      if (success) {
        toast({
          title: "PDF exported successfully!",
          description: "Your itinerary has been downloaded.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("PDF export error:", error)
      toast({
        title: "Export failed",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const LandingScreen = () => (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 indian-pattern opacity-30" />

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="hero-text-gradient">Discover</span>
                <br />
                <span className="text-white">Incredible</span>
                <br />
                <span className="text-primary">India</span>
              </h1>
              <p className="text-xl text-white/80 leading-relaxed max-w-lg">
                Your AI-powered travel companion for exploring India's rich heritage, vibrant culture, and breathtaking
                destinations. Powered by Google Cloud AI.
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">🚀 Unique Features:</h3>
                <ul className="space-y-2 text-white/90">
                  <li className="flex items-center space-x-2">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <span>AI-powered cultural insights & hidden gems</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-accent" />
                    <span>Real-time festival & event integration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <DollarSignIcon className="h-4 w-4 text-primary" />
                    <span>Smart budget optimization with local prices</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white pulse-glow"
                onClick={() => navigateToScreen("form")}
              >
                Plan My Trip
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <PlayIcon className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-white/60 text-sm">Trips Planned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">4.9★</div>
                <div className="text-white/60 text-sm">User Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100+</div>
                <div className="text-white/60 text-sm">Destinations</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Visual */}
          <div className="relative">
            <div className="floating-animation">
              <div className="relative">
                {/* Main Hero Image */}
                <img
                  src="/beautiful-indian-palace-at-sunset-with-vibrant-col.jpg"
                  alt="Beautiful Indian Palace at sunset with vibrant colors"
                  className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
                />

                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Jaipur, Rajasthan</div>
                      <div className="text-sm text-muted-foreground">5 days • ₹25,000</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                  <div className="flex items-center space-x-2">
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-foreground ml-2">Perfect Trip!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-4 py-20" id="features">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Why Choose YatraAI?</h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Experience the future of travel planning with AI-powered insights and local expertise
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-card/10 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <SparklesIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-white">AI-Powered Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                Advanced AI algorithms create personalized itineraries based on your preferences, budget, and travel
                style.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/10 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <UsersIcon className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-white">Local Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                Get insider tips, hidden gems, and cultural insights that only locals know about your destination.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/10 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUpIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-white">Smart Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                Optimize your time and budget with intelligent route planning and cost-effective recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  // Form Screen Component
  const FormScreen = () => (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <MapPinIcon className="h-6 w-6 text-primary" />
              <span>Trip Preferences</span>
            </CardTitle>
            <CardDescription className="text-base">
              Share your travel preferences and let AI create the perfect itinerary
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-base font-medium">
                  Destination Cities *
                  <span className="text-sm text-muted-foreground ml-2">({formData.destination.length} added)</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="destination"
                    placeholder="e.g., Jaipur, Goa, Manali"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    onKeyPress={handleDestinationKeyPress}
                    className="flex-1 text-base"
                  />
                  <Button
                    type="button"
                    onClick={handleAddDestination}
                    disabled={!destinationInput.trim()}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                {formData.destination.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.destination.map((dest) => (
                      <Badge
                        key={dest}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => handleRemoveDestination(dest)}
                      >
                        {dest}
                        <span className="ml-1">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
                {formData.destination.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add destinations by typing and pressing Enter or clicking Add
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center space-x-1 text-base font-medium">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Start Date *</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={today}
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center space-x-1 text-base font-medium">
                    <CalendarIcon className="h-4 w-4" />
                    <span>End Date *</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={formData.startDate || minEndDate}
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="text-base"
                    required
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center space-x-1 text-base font-medium">
                  <DollarSignIcon className="h-4 w-4" />
                  <span>Budget *</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="budget"
                    type="number"
                    min="1"
                    placeholder="50000"
                    value={formData.budget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                    className="flex-1 text-base"
                    required
                  />
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Travel Style *</Label>
                <Select
                  value={formData.travelStyle}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, travelStyle: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your travel style" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-1 text-base font-medium">
                  <TrainIcon className="h-4 w-4" />
                  <span>Mode of Travel *</span>
                </Label>
                <Select
                  value={formData.modeOfTravel}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, modeOfTravel: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preferred mode of travel" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Interests *
                  <span className="text-sm text-muted-foreground ml-2">({formData.interests.length} selected)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 text-sm px-3 py-1 ${
                        formData.interests.includes(interest)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-105"
                          : "hover:bg-primary/10 hover:border-primary/50"
                      }`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                      {formData.interests.includes(interest) && <span className="ml-1">✓</span>}
                    </Badge>
                  ))}
                </div>
                {formData.interests.length === 0 && (
                  <p className="text-sm text-muted-foreground">Please select at least one interest</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full text-lg py-6" size="lg" disabled={isGenerating}>
                <SparklesIcon className="mr-2 h-5 w-5" />
                {isGenerating ? "Generating..." : "Generate My Perfect Trip"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )

  return (
    <div className="dark">
      {/* Navigation - only show on non-landing screens */}
      {currentScreen !== "landing" && (
        <Navigation
          currentScreen={currentScreen}
          onNavigate={navigateToScreen}
          destination={formData.destination.join(", ")}
        />
      )}

      {/* Screen Container with Transitions */}
      <div className="relative">
        <ScreenTransition isActive={currentScreen === "landing"}>
          <LandingScreen />
        </ScreenTransition>

        <ScreenTransition isActive={currentScreen === "form"}>
          <FormScreen />
        </ScreenTransition>

        <ScreenTransition isActive={currentScreen === "loading"}>
          <EnhancedLoading destination={formData.destination.join(", ")} />
        </ScreenTransition>

        <ScreenTransition isActive={currentScreen === "results"}>
          <EnhancedResults
            itinerary={itinerary}
            formData={formData}
            onRegenerate={handleRegenerate}
            onExportPDF={handleExportPDF}
            isGenerating={isGenerating}
          />
        </ScreenTransition>
      </div>
    </div>
  )
}
