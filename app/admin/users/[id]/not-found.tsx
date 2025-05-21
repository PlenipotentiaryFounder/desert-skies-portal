export default function UserNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h1 className="text-4xl font-bold">User Not Found</h1>
      <p className="text-muted-foreground mt-2">The user you are looking for does not exist or has been deleted.</p>
      <a href="/admin/users" className="mt-6 underline">
        Return to User Management
      </a>
    </div>
  )
}
