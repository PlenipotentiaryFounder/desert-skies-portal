import { NextRequest, NextResponse } from 'next/server'
import { getStudentTrainingData } from '@/lib/student-training-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const trainingData = await getStudentTrainingData(studentId)
    return NextResponse.json(trainingData)
  } catch (error) {
    console.error('Error getting training data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training data' },
      { status: 500 }
    )
  }
}

