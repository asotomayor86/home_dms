import { redirect } from "next/navigation";

// El middleware ya gestiona el caso sin sesión (→ /login). Si hay sesión,
// la raíz lleva al dashboard.
export default function Home() {
  redirect("/dashboard");
}
