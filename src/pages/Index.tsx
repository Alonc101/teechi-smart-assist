import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Menu, Send, Loader2, BookOpen, ImagePlus, X, LoaderPinwheel } from "lucide-react";
import TopicSidebar from "@/components/TopicSidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

const Index = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicName, setSelectedTopicName] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [attachedImageName, setAttachedImageName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectTopic = (subjectId: number, subjectName: string, topicId: number, topicName: string) => {
    if (topicId !== selectedTopicId) {
      setMessages([]);
    }
    setSelectedSubjectId(subjectId);
    setSelectedSubjectName(subjectName);
    setSelectedTopicId(topicId);
    setSelectedTopicName(topicName);
    setSidebarOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("ניתן להעלות רק קבצי תמונה");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("הקובץ גדול מדי. גודל מקסימלי: 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      setAttachedImageName(file.name);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setAttachedImage(null);
    setAttachedImageName("");
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || sending) return;
    const msg = input.trim() || (attachedImage ? "מה יש בתמונה?" : "");
    const currentImage = attachedImage;
    setInput("");
    setAttachedImage(null);
    setAttachedImageName("");

    if (!selectedTopicId || !selectedSubjectId) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: msg, imageUrl: currentImage || undefined },
        { role: "assistant", content: "בבקשה בחר מקצוע ונושא מהתפריט כדי שאוכל לעזור לך 📚" },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: msg, imageUrl: currentImage || undefined }]);
    setSending(true);

    try {
      const body: any = { message: msg, subjectId: selectedSubjectId, topicId: selectedTopicId };
      if (currentImage) {
        body.imageBase64 = currentImage;
      }

      const response = await supabase.functions.invoke("chat-groq", { body });
      if (response.error) throw response.error;
      const answer = response.data?.answer || "שגיאה בקבלת תשובה";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "שגיאה בשליחת ההודעה. נסה שוב." }]);
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
          <SheetContent side="right" className="w-80 p-0" aria-describedby={undefined}>
            <VisuallyHidden>
              <SheetTitle>תפריט נושאים</SheetTitle>
            </VisuallyHidden>
            <TopicSidebar
              selectedTopicId={selectedTopicId}
              onSelectTopic={handleSelectTopic}
              isAdmin={isAdmin}
            />
          </SheetContent>
        </Sheet>
        <LoaderPinwheel className="h-6 w-6 text-primary-foreground" />
        <h1 className="text-xl font-bold text-primary-foreground">Teechi</h1>
        {selectedTopicName && (
          <Badge variant="secondary" className="mr-auto text-xs">
            {selectedSubjectName} / {selectedTopicName}
          </Badge>
        )}
      </header>

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 relative transition-colors ${dragOver ? "bg-primary/5" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/")) return;
          if (file.size > MAX_IMAGE_SIZE) {
            alert("הקובץ גדול מדי. גודל מקסימלי: 4MB");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            setAttachedImage(reader.result as string);
            setAttachedImageName(file.name);
          };
          reader.readAsDataURL(file);
        }}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-primary">
              <ImagePlus className="h-10 w-10" />
              <span className="text-sm font-medium">שחרר כדי לצרף תמונה</span>
            </div>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <BookOpen className="h-16 w-16 text-primary/30" />
            <h2 className="text-2xl font-bold text-foreground">שלום! 👋</h2>
            <p className="text-muted-foreground max-w-sm">
              {selectedTopicName
                ? `מוכן ללמוד ${selectedTopicName}? שאל אותי שאלה!`
                : "פתח את התפריט ובחר מקצוע ונושא כדי להתחיל ללמוד"}
            </p>
            {!selectedTopicName && (
              <Button onClick={() => setSidebarOpen(true)} variant="outline" className="gap-2">
                <Menu className="h-4 w-4" /> פתח תפריט
              </Button>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt="צרופה"
                  className="rounded-lg mb-2 max-h-60 w-auto object-contain cursor-pointer"
                  onClick={() => window.open(m.imageUrl, "_blank")}
                />
              )}
              {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
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

      {/* Image Preview */}
      {attachedImage && (
        <div className="border-t bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <div className="relative">
              <img
                src={attachedImage}
                alt="תצוגה מקדימה"
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -left-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {attachedImageName}
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-background p-3">
        <div className="flex gap-2 max-w-3xl mx-auto items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="הוסף תמונה"
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={selectedTopicName ? `שאל על ${selectedTopicName}...` : "בחר נושא כדי להתחיל..."}
            className="min-h-[44px] max-h-32 resize-none text-base"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            size="icon"
            disabled={sending || (!input.trim() && !attachedImage)}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
