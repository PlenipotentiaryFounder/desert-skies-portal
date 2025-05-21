"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BookOpen, Loader2, Plus } from "lucide-react"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

// Sample syllabi data
const sampleSyllabi = [
  {
    title: "Private Pilot Certificate",
    description:
      "A comprehensive training program for the Private Pilot Certificate. This syllabus covers all required aeronautical knowledge and flight proficiency standards required by FAR Part 61.",
    faa_type: "Private Pilot (PPL)",
    version: "1.0",
    is_active: true,
    lessons: [
      {
        title: "Introduction to Flight",
        description: "Introduction to the aircraft, basic flight maneuvers, and airport operations.",
        order_index: 0,
        lesson_type: "Ground",
        estimated_hours: 2,
      },
      {
        title: "First Flight - Aircraft Control",
        description:
          "Introduction to the fundamentals of flight including straight and level flight, climbs, descents, and turns.",
        order_index: 1,
        lesson_type: "Flight",
        estimated_hours: 1.5,
      },
      {
        title: "Basic Aircraft Control",
        description:
          "Practice basic flight maneuvers including straight and level flight, climbs, descents, and turns.",
        order_index: 2,
        lesson_type: "Flight",
        estimated_hours: 1.5,
      },
      {
        title: "Airport Operations",
        description: "Introduction to airport traffic patterns, radio communications, and takeoffs and landings.",
        order_index: 3,
        lesson_type: "Ground",
        estimated_hours: 2,
      },
      {
        title: "Takeoffs and Landings",
        description: "Practice normal and crosswind takeoffs and landings.",
        order_index: 4,
        lesson_type: "Flight",
        estimated_hours: 1.5,
      },
      {
        title: "Slow Flight and Stalls",
        description: "Introduction to slow flight, power-off and power-on stalls, and stall recovery procedures.",
        order_index: 5,
        lesson_type: "Flight",
        estimated_hours: 1.5,
      },
      {
        title: "Ground Reference Maneuvers",
        description:
          "Practice ground reference maneuvers including turns around a point, S-turns, and rectangular course.",
        order_index: 6,
        lesson_type: "Flight",
        estimated_hours: 1.5,
      },
      {
        title: "Navigation and Cross-Country Planning",
        description: "Introduction to VFR navigation, flight planning, and cross-country procedures.",
        order_index: 7,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Cross-Country Flight",
        description: "Dual cross-country flight to practice navigation and flight planning skills.",
        order_index: 8,
        lesson_type: "Flight",
        estimated_hours: 3,
      },
      {
        title: "Solo Flight Preparation",
        description: "Review of all maneuvers and procedures in preparation for solo flight.",
        order_index: 9,
        lesson_type: "Flight",
        estimated_hours: 1.5,
      },
      {
        title: "First Solo Flight",
        description: "First solo flight in the traffic pattern.",
        order_index: 10,
        lesson_type: "Flight",
        estimated_hours: 1,
      },
      {
        title: "Solo Practice",
        description: "Solo practice of basic maneuvers and traffic pattern operations.",
        order_index: 11,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Advanced Maneuvers",
        description:
          "Introduction to advanced maneuvers including steep turns, emergency procedures, and night operations.",
        order_index: 12,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Solo Cross-Country",
        description: "Solo cross-country flight to practice navigation and flight planning skills.",
        order_index: 13,
        lesson_type: "Flight",
        estimated_hours: 3,
      },
      {
        title: "Night Flight",
        description: "Introduction to night flying operations and procedures.",
        order_index: 14,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Checkride Preparation",
        description: "Review of all maneuvers and procedures in preparation for the private pilot checkride.",
        order_index: 15,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Mock Checkride",
        description: "Simulated checkride to prepare for the actual FAA practical test.",
        order_index: 16,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
    ],
  },
  {
    title: "Instrument Rating",
    description:
      "A comprehensive training program for the Instrument Rating. This syllabus covers all required aeronautical knowledge and flight proficiency standards required by FAR Part 61.",
    faa_type: "Instrument Rating (IR)",
    version: "1.0",
    is_active: true,
    lessons: [
      {
        title: "Instrument Flying Fundamentals",
        description: "Introduction to instrument flying concepts, regulations, and procedures.",
        order_index: 0,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Basic Instrument Maneuvers",
        description: "Introduction to basic instrument flight maneuvers using solely the aircraft instruments.",
        order_index: 1,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Navigation Systems",
        description: "Introduction to VOR, GPS, and other navigation systems used in instrument flying.",
        order_index: 2,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Instrument Navigation",
        description: "Practice using navigation systems for instrument approaches and en route navigation.",
        order_index: 3,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Holding Patterns",
        description: "Introduction to holding pattern procedures and techniques.",
        order_index: 4,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Instrument Approach Procedures",
        description: "Introduction to instrument approach procedures including precision and non-precision approaches.",
        order_index: 5,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "ILS Approaches",
        description: "Practice ILS approach procedures.",
        order_index: 6,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Non-Precision Approaches",
        description: "Practice non-precision approach procedures including VOR and GPS approaches.",
        order_index: 7,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Partial Panel Operations",
        description: "Practice instrument flying with simulated instrument failures.",
        order_index: 8,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Cross-Country IFR Planning",
        description: "Introduction to IFR cross-country flight planning and procedures.",
        order_index: 9,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "IFR Cross-Country",
        description: "Dual IFR cross-country flight to practice IFR procedures and navigation.",
        order_index: 10,
        lesson_type: "Flight",
        estimated_hours: 4,
      },
      {
        title: "Emergency Procedures",
        description: "Practice emergency procedures in instrument conditions.",
        order_index: 11,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Checkride Preparation",
        description: "Review of all instrument procedures in preparation for the instrument rating checkride.",
        order_index: 12,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Mock Checkride",
        description: "Simulated checkride to prepare for the actual FAA practical test.",
        order_index: 13,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
    ],
  },
  {
    title: "Commercial Pilot Certificate",
    description:
      "A comprehensive training program for the Commercial Pilot Certificate. This syllabus covers all required aeronautical knowledge and flight proficiency standards required by FAR Part 61.",
    faa_type: "Commercial Pilot (CPL)",
    version: "1.0",
    is_active: true,
    lessons: [
      {
        title: "Commercial Pilot Operations",
        description: "Introduction to commercial pilot operations, regulations, and procedures.",
        order_index: 0,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Advanced Aircraft Control",
        description: "Practice of advanced aircraft control techniques required for commercial pilots.",
        order_index: 1,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Commercial Maneuvers",
        description:
          "Introduction to commercial pilot maneuvers including chandelles, lazy eights, and eights on pylons.",
        order_index: 2,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Complex Aircraft Operations",
        description:
          "Introduction to complex aircraft operations including retractable landing gear and constant-speed propellers.",
        order_index: 3,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Complex Aircraft Flight",
        description: "Practice flying complex aircraft and associated procedures.",
        order_index: 4,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Advanced Commercial Maneuvers",
        description:
          "Practice of advanced commercial maneuvers including chandelles, lazy eights, and eights on pylons.",
        order_index: 5,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Emergency Operations",
        description: "Practice of emergency procedures and operations at the commercial pilot level.",
        order_index: 6,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "High Performance Operations",
        description: "Introduction to high performance aircraft operations.",
        order_index: 7,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "High Performance Flight",
        description: "Practice flying high performance aircraft and associated procedures.",
        order_index: 8,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Commercial Cross-Country",
        description: "Cross-country flight operations at the commercial pilot level.",
        order_index: 9,
        lesson_type: "Flight",
        estimated_hours: 4,
      },
      {
        title: "Night Operations",
        description: "Advanced night flying operations for commercial pilots.",
        order_index: 10,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Checkride Preparation",
        description:
          "Review of all commercial maneuvers and procedures in preparation for the commercial pilot checkride.",
        order_index: 11,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Mock Checkride",
        description: "Simulated checkride to prepare for the actual FAA practical test.",
        order_index: 12,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
    ],
  },
  {
    title: "Certified Flight Instructor",
    description:
      "A comprehensive training program for the Certified Flight Instructor Certificate. This syllabus covers all required aeronautical knowledge and flight proficiency standards required by FAR Part 61.",
    faa_type: "Flight Instructor (CFI)",
    version: "1.0",
    is_active: true,
    lessons: [
      {
        title: "Fundamentals of Instruction",
        description: "Introduction to teaching methods, learning processes, and effective instruction techniques.",
        order_index: 0,
        lesson_type: "Ground",
        estimated_hours: 4,
      },
      {
        title: "Teaching Techniques",
        description: "Development of effective teaching techniques and lesson planning.",
        order_index: 1,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Teaching Flight Maneuvers",
        description: "Techniques for teaching basic flight maneuvers from the right seat.",
        order_index: 2,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Teaching Takeoffs and Landings",
        description: "Techniques for teaching takeoffs and landings from the right seat.",
        order_index: 3,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Teaching Ground Reference Maneuvers",
        description: "Techniques for teaching ground reference maneuvers from the right seat.",
        order_index: 4,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Teaching Slow Flight and Stalls",
        description: "Techniques for teaching slow flight and stalls from the right seat.",
        order_index: 5,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Teaching Emergency Procedures",
        description: "Techniques for teaching emergency procedures from the right seat.",
        order_index: 6,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Teaching Cross-Country Procedures",
        description: "Techniques for teaching cross-country procedures and navigation.",
        order_index: 7,
        lesson_type: "Flight",
        estimated_hours: 3,
      },
      {
        title: "Teaching Night Operations",
        description: "Techniques for teaching night flying operations and procedures.",
        order_index: 8,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
      {
        title: "Practical Test Standards Review",
        description: "Review of practical test standards and checkride preparation techniques.",
        order_index: 9,
        lesson_type: "Ground",
        estimated_hours: 3,
      },
      {
        title: "Mock Lessons",
        description: "Practice giving ground and flight instruction for various maneuvers and procedures.",
        order_index: 10,
        lesson_type: "Flight",
        estimated_hours: 3,
      },
      {
        title: "Checkride Preparation",
        description: "Final preparation for the CFI checkride including mock teaching scenarios.",
        order_index: 11,
        lesson_type: "Flight",
        estimated_hours: 2,
      },
    ],
  },
]

export default function SeedSyllabiPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState({
    syllabi: 0,
    lessons: 0,
    totalSyllabi: sampleSyllabi.length,
    totalLessons: sampleSyllabi.reduce((acc, syllabus) => acc + syllabus.lessons.length, 0),
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const handleSeedSyllabi = async () => {
    setIsSeeding(true)
    setProgress({
      syllabi: 0,
      lessons: 0,
      totalSyllabi: sampleSyllabi.length,
      totalLessons: sampleSyllabi.reduce((acc, syllabus) => acc + syllabus.lessons.length, 0),
    })

    try {
      // Check if we already have syllabi in the database
      const { count } = await supabase.from("syllabi").select("*", { count: "exact", head: true })

      if (count && count > 0) {
        toast({
          title: "Syllabi already exist",
          description: `Found ${count} syllabi in the database. Skipping seed operation.`,
          variant: "default",
        })
        setIsSeeding(false)
        return
      }

      // Insert sample syllabi and their lessons
      for (const syllabus of sampleSyllabi) {
        // Insert syllabus
        const { data: syllabusData, error: syllabusError } = await supabase
          .from("syllabi")
          .insert({
            title: syllabus.title,
            description: syllabus.description,
            faa_type: syllabus.faa_type,
            version: syllabus.version,
            is_active: syllabus.is_active,
          })
          .select()

        if (syllabusError) {
          console.error("Error seeding syllabus:", syllabusError)
          toast({
            title: "Error",
            description: `Failed to seed syllabus: ${syllabusError.message}`,
            variant: "destructive",
          })
          setIsSeeding(false)
          return
        }

        setProgress((prev) => ({ ...prev, syllabi: prev.syllabi + 1 }))

        // Insert lessons for this syllabus
        const syllabusId = syllabusData[0].id
        for (const lesson of syllabus.lessons) {
          const { error: lessonError } = await supabase.from("syllabus_lessons").insert({
            syllabus_id: syllabusId,
            title: lesson.title,
            description: lesson.description,
            order_index: lesson.order_index,
            lesson_type: lesson.lesson_type,
            estimated_hours: lesson.estimated_hours,
          })

          if (lessonError) {
            console.error("Error seeding lesson:", lessonError)
            toast({
              title: "Error",
              description: `Failed to seed lesson: ${lessonError.message}`,
              variant: "destructive",
            })
            setIsSeeding(false)
            return
          }

          setProgress((prev) => ({ ...prev, lessons: prev.lessons + 1 }))
        }
      }

      toast({
        title: "Success",
        description: `Successfully seeded ${sampleSyllabi.length} syllabi with ${progress.totalLessons} lessons into the database.`,
        variant: "default",
      })

      setIsComplete(true)
    } catch (error) {
      console.error("Error in seed operation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during the seed operation.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Seed Syllabi Data
          </CardTitle>
          <CardDescription>
            Populate your database with sample training syllabi and lessons for testing and development purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">This will add the following syllabi to your database:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {sampleSyllabi.map((syllabus) => (
                  <li key={syllabus.title}>
                    {syllabus.title} ({syllabus.faa_type}) - {syllabus.lessons.length} lessons
                  </li>
                ))}
              </ul>
            </div>

            {isSeeding && (
              <div className="flex flex-col items-center justify-center p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>
                    Seeding syllabi... ({progress.syllabi}/{progress.totalSyllabi})
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>
                    Seeding lessons... ({progress.lessons}/{progress.totalLessons})
                  </p>
                </div>
              </div>
            )}

            {isComplete && (
              <div className="rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <p className="font-medium">Syllabi data seeded successfully!</p>
                <p className="text-sm mt-1">
                  {progress.syllabi} syllabi and {progress.lessons} lessons have been added to your database.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/syllabi")}>
            Back to Syllabi
          </Button>
          <Button onClick={handleSeedSyllabi} disabled={isSeeding || isComplete}>
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : isComplete ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add More Syllabi
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Seed Syllabi Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
