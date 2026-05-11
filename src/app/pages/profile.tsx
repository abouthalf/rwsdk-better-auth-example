import { LogoutButton } from "@/app/shared/LogoutButton";

export const ProfilePage = () => {
  return (
    <div className="relative min-h-screen p-8">
      <div className="absolute top-4 right-4">
        <LogoutButton />
      </div>
      <main>
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <p className="text-gray-600">Edit your profile information here.</p>
      </main>
    </div>
  );
};
