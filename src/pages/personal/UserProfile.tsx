import UserProfilePage from "@/components/profile/user-profile"
import AuthProvider from "@/providers/AuthProvider"

const UserProfile = () => {
  return (
    <AuthProvider>
        <UserProfilePage />
    </AuthProvider>
  )
}

export default UserProfile