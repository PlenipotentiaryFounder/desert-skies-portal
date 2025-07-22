"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoginForm } from '@/components/auth/login-form'
import { 
  Plane, 
  Cloud, 
  Sun, 
  Moon, 
  CloudRain, 
  CloudLightning,
  Navigation,
  Compass,
  MapPin,
  Wind,
  Thermometer,
  Shield
} from 'lucide-react'

// Floating Particles Component
const FloatingParticles = () => {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const particles = Array.from({ length: 20 }, (_, i) => i)
  
  if (!isClient) {
    return null // Don't render particles during SSR
  }
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-aviation-sunset-400/30 rounded-full"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          animate={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Animated Grid Component
const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 opacity-20">
      <div 
        className="w-full h-full grid-pattern"
        style={{
          backgroundSize: '50px 50px',
          backgroundImage: `
            linear-gradient(rgba(255, 179, 71, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 179, 71, 0.1) 1px, transparent 1px)
          `
        }}
      />
    </div>
  )
}

// Floating Aircraft Component
const FloatingAircraft = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-10 text-aviation-sunset-400/20"
        animate={{
          x: [0, 100, 0],
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Plane className="w-8 h-8" />
      </motion.div>
      
      <motion.div
        className="absolute top-40 right-20 text-aviation-sky-400/20"
        animate={{
          x: [0, -80, 0],
          y: [0, 30, 0],
          rotate: [0, -8, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <Plane className="w-6 h-6" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-32 left-1/4 text-aviation-sunset-300/15"
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          rotate: [0, 3, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      >
        <Plane className="w-4 h-4" />
      </motion.div>
    </div>
  )
}

// Weather Elements Component
const WeatherElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sun */}
      <motion.div
        className="absolute top-10 right-10 text-aviation-sunset-400/30"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Sun className="w-12 h-12" />
      </motion.div>
      
      {/* Clouds */}
      <motion.div
        className="absolute top-20 left-1/3 text-white/10"
        animate={{
          x: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Cloud className="w-16 h-16" />
      </motion.div>
      
      <motion.div
        className="absolute top-40 right-1/3 text-white/8"
        animate={{
          x: [0, -80, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      >
        <Cloud className="w-12 h-12" />
      </motion.div>
      
      {/* Navigation Elements */}
      <motion.div
        className="absolute bottom-20 right-10 text-aviation-sky-400/20"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Compass className="w-8 h-8" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-40 left-10 text-aviation-sunset-400/20"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Navigation className="w-6 h-6" />
      </motion.div>
    </div>
  )
}

export default function LoginUI() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-night-sky">
      {/* Background Elements */}
      <AnimatedGrid />
      <FloatingParticles />
      <FloatingAircraft />
      <WeatherElements />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-aviation-sunset-500/5 via-transparent to-aviation-sky-600/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-aviation-night-900/20 via-transparent to-transparent" />
      
      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-aviation-sunset-500/10 to-transparent rounded-br-full" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-aviation-sky-600/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-aviation-sunset-500/10 to-transparent rounded-tr-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-aviation-sky-600/10 to-transparent rounded-tl-full" />
      
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <motion.div
              className="flex justify-center mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-aviation-sunset-500 to-aviation-sunset-600 rounded-2xl flex items-center justify-center shadow-sunset-lg animate-sunset-glow">
                  <Plane className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-aviation-sunset-400/20 to-aviation-sky-600/20 rounded-2xl blur-xl animate-pulse-soft" />
              </div>
            </motion.div>
            
            <motion.h1
              className="text-5xl font-bold text-foreground mb-3 font-display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Desert Skies
            </motion.h1>
            
            <motion.p
              className="text-xl text-muted-foreground font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Aviation Training Portal
            </motion.p>
          </motion.div>
          
          {/* Login Form */}
          <LoginForm />
          
          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-center mt-8"
          >
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <motion.a
                href="/legal/terms"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-aviation-sunset-300 transition-colors"
              >
                Terms of Service
              </motion.a>
              <span>•</span>
              <motion.a
                href="/legal/privacy-policy"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-aviation-sunset-300 transition-colors"
              >
                Privacy Policy
              </motion.a>
              <span>•</span>
              <motion.a
                href="/support"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-aviation-sunset-300 transition-colors"
              >
                Support
              </motion.a>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Secure • Reliable • Professional</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 