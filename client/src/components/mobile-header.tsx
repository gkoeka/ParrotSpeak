import React from 'react'
import { Button } from "@/components/ui/button"
import { MessageSquare, User, Lightbulb } from "lucide-react"
import { useLocation } from "wouter"

/**
 * A static component that simulates the mobile app header for the preview
 */
export default function MobileHeader() {
  const [, navigate] = useLocation();

  return (
    <div className="flex justify-between items-center px-4 py-3 border-b">
      {/* Logo on the left */}
      <div className="rounded-full overflow-hidden w-9 h-9 flex items-center justify-center">
        <img 
          src="/images/parrotspeak-logo.png" 
          alt="ParrotSpeak Logo" 
          className="h-9 w-9"
        />
      </div>
      
      <h1 className="text-xl font-bold text-indigo-600">ParrotSpeak</h1>
      
      <div className="flex gap-2">
        {/* Feedback button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 px-2 bg-indigo-50 text-indigo-600"
          onClick={() => navigate('/settings?tab=feedback')}
        >
          <Lightbulb className="h-4 w-4" />
          <span className="text-xs font-medium">Feedback</span>
        </Button>
        
        {/* User profile icon */}
        <Button variant="ghost" size="icon" className="rounded-full bg-indigo-50">
          <User className="h-5 w-5 text-indigo-600" />
        </Button>
      </div>
    </div>
  )
}