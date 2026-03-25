import { Loader2, Bike } from "lucide-react";

interface SearchingMotoboyProps {
  status: "searching" | "found" | "on_way";
  motoboyName?: string;
}

const SearchingMotoboy = ({ status, motoboyName }: SearchingMotoboyProps) => {
  const messages = {
    searching: "Procurando motoboy mais próximo...",
    found: `Motoboy encontrado! ${motoboyName || ""}`,
    on_way: "A caminho!",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm animate-fade-in-up">
      {status === "searching" ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bike className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">{messages[status]}</p>
        {status === "searching" && (
          <p className="text-xs text-muted-foreground mt-0.5">Isso pode levar alguns segundos</p>
        )}
      </div>
    </div>
  );
};

export default SearchingMotoboy;
