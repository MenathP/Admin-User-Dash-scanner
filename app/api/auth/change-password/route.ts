import { NextRequest, NextResponse } from "next/server"

// Mock user database - replace with your actual database
// For demo purposes, we'll use plain text passwords
const users = [
  {
    id: "1",
    username: "admin",
    name: "John Doe",
    email: "john@example.com",
    code: "EMP001",
    role: "admin",
    password: "password123"
  },
  {
    id: "2", 
    username: "user",
    name: "Jane Smith",
    email: "jane@example.com",
    code: "EMP002",
    role: "user",
    password: "password123"
  }
]

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, userId } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // For demo purposes, we'll use the userId from the request
    // In a real app, you'd get the user ID from the JWT token
    const user = users.find(u => u.id === userId || u.username === userId)
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // Verify current password (plain text comparison for demo)
    if (currentPassword !== user.password) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Update user password (in a real app, you'd hash it and update the database)
    user.password = newPassword

    console.log(`Password changed for user: ${user.email}`)

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    )

  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}