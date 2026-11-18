import { redirect } from "next/navigation";

export const metadata = { title: "Importar expedientes desde Excel" };
export default function ExcelPage() {
  // Mantiene operativos los enlaces anteriores; Excel ahora es la entrada principal.
  redirect("/procesos/coljuegos");
}
