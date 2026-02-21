import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Send, Loader2 } from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  updated_at: string;
  subject_id: number | null;
  topic_id: number | null;
}

const Index = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: number; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Load student id
  useEffect(() => {
    if (!user) return;
    supabase.from("students").select("id").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setStudentId(data.id);
    });
  }, [user]);

  // Load subjects
  useEffect(() => {
    supabase.from("subjects").select("id, name").then(({ data }) => {
      if (data) setSubjects(data);
    });
  }, []);

  // Load topics when subject changes
  useEffect(() => {
    if (!selectedSubject) { setTopics([]); return; }
    supabase.from("topics").select("id, name").eq("subject_id", Number(selectedSubject)).then(({ data }) => {
      if (data) setTopics(data);
    });
  }, [selectedSubject]);

  // Load sessions
  const loadSessions = async () => {
    if (!studentId) return;
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at, subject_id, topic_id")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false });
    if (data) setSessions(data);
  };

  useEffect(() => { loadSessions(); }, [studentId]);

  // Load messages
  useEffect(() => {
    if (!activeSession) { setMessages([]); return; }
    supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", activeSession)
      .neq("role", "system")
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }, [activeSession]);

  // Realtime messages
  useEffect(() => {
    if (!activeSession) return;
    const channel = supabase
      .channel(`messages-${activeSession}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${activeSession}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.role !== "system") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSession]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const createNewChat = async () => {
    if (!studentId) return;
    const subjectId = selectedSubject ? Number(selectedSubject) : null;
    const topicId = selectedTopic ? Number(selectedTopic) : null;
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ student_id: studentId, subject_id: subjectId, topic_id: topicId })
      .select()
      .single();
    if (data) {
      setActiveSession(data.id);
      setSidebarOpen(false);
      loadSessions();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("chat-groq", {
        body: { session_id: activeSession, message: msg },
      });
      if (response.error) throw response.error;
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background" dir="rtl">
      {/* Top Bar */}
      <header className="flex items-center gap-3 border-b bg-primary px-4 py-3">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <ChatSidebar
              sessions={sessions}
              activeSessionId={activeSession}
              onSelectSession={(id) => { setActiveSession(id); setSidebarOpen(false); }}
              onNewChat={createNewChat}
              onRefresh={loadSessions}
              isAdmin={isAdmin}
            />
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold text-primary-foreground">Teechi 🎓</h1>
      </header>

      {/* Main area */}
      {!activeSession ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <h2 className="text-2xl font-bold">שלום! 👋</h2>
          <p className="text-muted-foreground text-center max-w-sm">בחר מקצוע ונושא, ולחץ על "צ׳אט חדש" כדי להתחיל</p>
          <div className="w-full max-w-xs space-y-3">
            <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSelectedTopic(""); }}>
              <SelectTrigger><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {topics.length > 0 && (
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger><SelectValue placeholder="בחר נושא" /></SelectTrigger>
                <SelectContent>
                  {topics.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={createNewChat} className="w-full">צ׳אט חדש</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-end">
                <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-background p-3">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="כתוב הודעה..."
                className="min-h-[44px] max-h-32 resize-none text-base"
                rows={1}
              />
              <Button onClick={sendMessage} size="icon" disabled={sending || !input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
