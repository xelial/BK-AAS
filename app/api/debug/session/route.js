import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      authenticated: !!session,
      session: session,
      user: session?.user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}