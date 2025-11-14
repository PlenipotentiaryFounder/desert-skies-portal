import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createUser } from "@/lib/user-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has admin role
    const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', {
      p_user_id: user.id
    })

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    const roles = userRoles as { role_name: string }[] || []
    const hasAdmin = roles.some(r => r.role_name === 'admin')

    if (!hasAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      phone_number,
      date_of_birth,
      address_line1,
      city,
      state,
      zip_code,
      certificate_type,
      send_welcome_email
    } = body

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json({ 
        error: "Missing required fields: first_name, last_name, email" 
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        error: "A user with this email already exists" 
      }, { status: 400 })
    }

    // Generate a temporary password
    const tempPassword = generateTemporaryPassword()

    // Create user account
    const createResult = await createUser({
      email,
      first_name,
      last_name,
      phone: phone_number,
      date_of_birth,
      address_line1,
      city,
      state,
      zip_code,
      status: "active",
      password: tempPassword
    })

    if (!createResult.success || !createResult.userId) {
      throw new Error(createResult.error || "Failed to create user")
    }

    const studentId = createResult.userId

    // Assign student role
    const { data: roleRow, error: roleLookupError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "student")
      .single()

    if (!roleLookupError && roleRow) {
      await supabase.from("user_roles").insert({ 
        user_id: studentId, 
        role_id: roleRow.id 
      })
    }

    // Create student onboarding record
    await supabase.from("student_onboarding").insert({
      user_id: studentId,
      first_name,
      last_name,
      current_step: "welcome",
      step_number: 1,
      desired_program: certificate_type || null
    })

    // Send welcome email if requested
    if (send_welcome_email) {
      try {
        const { sendEmail } = await import('@/lib/email-service')
        await sendEmail({
          to: email,
          subject: "Welcome to Desert Skies Aviation",
          html: generateWelcomeEmailHTML(first_name, email, tempPassword),
          text: generateWelcomeEmailText(first_name, email, tempPassword)
        })
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      studentId,
      message: "Student created successfully",
      temporaryPassword: send_welcome_email ? undefined : tempPassword // Only return if not emailed
    })

  } catch (error) {
    console.error('Error in create student API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create student" },
      { status: 500 }
    )
  }
}

function generateTemporaryPassword(): string {
  // Generate a secure random password
  const length = 12
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

function generateWelcomeEmailHTML(firstName: string, email: string, tempPassword: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Desert Skies Aviation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Welcome to Desert Skies Aviation
              </h1>
              <p style="margin: 10px 0 0; color: #e0f2fe; font-size: 16px;">
                Your account has been created
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello ${firstName},
              </p>
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Your student account has been created at Desert Skies Aviation. You can now access our comprehensive student portal to manage your flight training.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #0369a1; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #0c4a6e; font-size: 18px;">Your Login Credentials</h3>
                <p style="margin: 0 0 10px; color: #1f2937; font-size: 14px;">
                  <strong>Email:</strong> ${email}
                </p>
                <p style="margin: 0 0 10px; color: #1f2937; font-size: 14px;">
                  <strong>Temporary Password:</strong> <code style="background-color: #e0f2fe; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code>
                </p>
                <p style="margin: 15px 0 0; color: #7c2d12; font-size: 13px; font-weight: bold;">
                  ⚠️ Please change your password after your first login for security.
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/signin" style="display: inline-block; padding: 16px 40px; background-color: #0369a1; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                  Sign In to Portal
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to contact us.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                <strong>Desert Skies Aviation</strong><br>
                Scottsdale, Arizona<br>
                Phone: (480) 264-0865<br>
                Email: thomas@desertskiesaviationaz.com
              </p>
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
                This email was sent to ${email}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function generateWelcomeEmailText(firstName: string, email: string, tempPassword: string): string {
  return `
Welcome to Desert Skies Aviation

Hello ${firstName},

Your student account has been created at Desert Skies Aviation. You can now access our comprehensive student portal to manage your flight training.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

⚠️ Please change your password after your first login for security.

Sign in at: ${process.env.NEXT_PUBLIC_APP_URL}/signin

If you have any questions or need assistance, please don't hesitate to contact us.

Desert Skies Aviation
Scottsdale, Arizona
Phone: (480) 264-0865
Email: thomas@desertskiesaviationaz.com

This email was sent to ${email}.
  `
}

