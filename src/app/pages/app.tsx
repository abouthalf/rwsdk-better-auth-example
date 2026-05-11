import { LogoutButton } from "@/app/shared/LogoutButton";

export const AppPage = () => {
  return (
    <div className="relative min-h-screen p-8">
      <div className="absolute top-4 right-4">
        <LogoutButton />
      </div>
      <main>
        <h1 className="text-2xl font-bold mb-2">App</h1>
        <p className="text-gray-600">You're logged in. This is the main app page.</p>
      </main>
    </div>
  );
};
