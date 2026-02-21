import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare, Trash2, Pencil, Check, X, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

const ChatSidebar = ({ sessions, activeSessionId, onSelectSession, onNewChat, onRefresh, isAdmin }: ChatSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const navigate = useNavigate();

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    await supabase.from("chat_sessions").update({ title: editTitle }).eq("id", id);
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("session_id", id);
    await supabase.from("chat_sessions").delete().eq("id", id);
    onRefresh();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-full flex-col bg-secondary/50">
      <div className="p-3">
        <Button onClick={onNewChat} className="w-full gap-2" variant="outline">
          <Plus className="h-4 w-4" /> צ׳אט חדש
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
              s.id === activeSessionId ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            {editingId === s.id ? (
              <div className="flex items-center gap-1 w-full">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleRename(s.id)}
                />
                <button onClick={() => handleRename(s.id)}><Check className="h-3 w-3" /></button>
                <button onClick={() => setEditingId(null)}><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <>
                <div className="flex-1 truncate" onClick={() => onSelectSession(s.id)}>
                  <MessageSquare className="inline h-3 w-3 mr-1" />
                  {s.title}
                </div>
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={() => { setEditingId(s.id); setEditTitle(s.title); }}>
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t p-3 space-y-2">
        {isAdmin && (
          <Button onClick={() => navigate("/admin")} variant="ghost" className="w-full justify-start gap-2 text-sm">
            <Shield className="h-4 w-4" /> ניהול (Admin)
          </Button>
        )}
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-2 text-sm text-destructive">
          <LogOut className="h-4 w-4" /> התנתק
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
