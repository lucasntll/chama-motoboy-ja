// Helper centralizado para sessão local de estabelecimentos e motoboys
export type UserType = "estabelecimento" | "motoboy";

export interface LocalSession {
  loggedIn: boolean;
  type: UserType | null;
  id: string | null;
  name: string | null;
}

export const getSession = (): LocalSession => {
  return {
    loggedIn: localStorage.getItem("usuario_logado") === "true",
    type: (localStorage.getItem("tipo_usuario") as UserType) || null,
    id: localStorage.getItem("usuario_id"),
    name: localStorage.getItem("nome_usuario"),
  };
};

export const clearSession = () => {
  // Chaves novas padronizadas
  localStorage.removeItem("usuario_logado");
  localStorage.removeItem("tipo_usuario");
  localStorage.removeItem("usuario_id");
  localStorage.removeItem("nome_usuario");
  // Chaves legadas (compatibilidade)
  localStorage.removeItem("establishment_id");
  localStorage.removeItem("establishment_name");
  localStorage.removeItem("motoboy_id");
  localStorage.removeItem("motoboy_name");
};
