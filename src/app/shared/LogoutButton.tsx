export const LogoutButton = () => (
  <form method="post" action="/logout">
    <button
      type="submit"
      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
    >
      Log out
    </button>
  </form>
);
