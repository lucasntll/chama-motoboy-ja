import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";

interface FeedbackModalProps {
  orderId: string;
  motoboyId: string;
  motoboyName: string;
  onClose: () => void;
}

const FeedbackModal = ({ orderId, motoboyId, motoboyName, onClose }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma nota de 1 a 5 estrelas");
      return;
    }
    setSubmitting(true);
    await supabase.from("reviews" as any).insert({
      order_id: orderId,
      motoboy_id: motoboyId,
      rating,
      comment: comment.trim(),
    });
    toast.success("Obrigado pelo seu feedback! ⭐");
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Avaliar entrega</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Como foi a entrega com <span className="font-semibold text-foreground">{motoboyName}</span>?
        </p>

        <div className="flex justify-center py-2">
          <StarRating rating={rating} onRate={setRating} size={32} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Deixe um comentário (opcional)"
          rows={3}
          className="w-full rounded-xl border bg-background py-3 px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar feedback ⭐"}
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
