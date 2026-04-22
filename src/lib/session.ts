// Helper centralizado para sessão local de estabelecimentos e motoboys
export type UserType = "estabelecimento" | "motoboy";

export interface LocalSession {
  loggedIn: boolean;
  type: UserType | null;
  id: string | null;
  name: string | null;
  phone?: string | null;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export interface SaveSessionInput {
  type: UserType;
  id: string;
  name: string;
  phone?: string | null;
}

export const saveSession = ({ type, id, name, phone }: SaveSessionInput) => {
  const now = Date.now();
  localStorage.setItem("usuario_logado", "true");
  localStorage.setItem("tipo_usuario", type);
  localStorage.setItem("usuario_id", id);
  localStorage.setItem("nome_usuario", name);
  if (phone) localStorage.setItem("telefone_usuario", phone);
  localStorage.setItem("sessao_criada_em", String(now));
  localStorage.setItem("sessao_ultimo_acesso", String(now));

  // Compatibilidade com chaves legadas
  if (type === "estabelecimento") {
    localStorage.setItem("establishment_id", id);
    localStorage.setItem("establishment_name", name);
  } else if (type === "motoboy") {
    localStorage.setItem("motoboy_id", id);
    localStorage.setItem("motoboy_name", name);
  }
};

const isExpired = (): boolean => {
  const last = Number(localStorage.getItem("sessao_ultimo_acesso") || "0");
  if (!last) return false; // sessão antiga sem timestamp: tratamos como válida
  return Date.now() - last > SESSION_TTL_MS;
};

export const touchSession = () => {
  if (localStorage.getItem("usuario_logado") === "true") {
    localStorage.setItem("sessao_ultimo_acesso", String(Date.now()));
  }
};

export const getSession = (): LocalSession => {
  if (localStorage.getItem("usuario_logado") === "true" && isExpired()) {
    clearSession();
    return { loggedIn: false, type: null, id: null, name: null, phone: null };
  }
  // Renova janela de 30 dias a cada acesso
  touchSession();
  return {
    loggedIn: localStorage.getItem("usuario_logado") === "true",
    type: (localStorage.getItem("tipo_usuario") as UserType) || null,
    id: localStorage.getItem("usuario_id"),
    name: localStorage.getItem("nome_usuario"),
    phone: localStorage.getItem("telefone_usuario"),
  };
};

export const clearSession = () => {
  // Chaves novas padronizadas
  localStorage.removeItem("usuario_logado");
  localStorage.removeItem("tipo_usuario");
  localStorage.removeItem("usuario_id");
  localStorage.removeItem("nome_usuario");
  localStorage.removeItem("telefone_usuario");
  localStorage.removeItem("sessao_criada_em");
  localStorage.removeItem("sessao_ultimo_acesso");
  // Chaves legadas (compatibilidade)
  localStorage.removeItem("establishment_id");
  localStorage.removeItem("establishment_name");
  localStorage.removeItem("motoboy_id");
  localStorage.removeItem("motoboy_name");
};
