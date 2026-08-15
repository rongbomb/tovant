export type UserRole = "owner" | "provider" | "admin";

export function dashboardPathForRole(role: string): string {
  switch (role) {
    case "provider":
      return "/provider/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "owner":
    default:
      return "/owner/dashboard";
  }
}
