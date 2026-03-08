import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronLeft, BookOpen, LogOut, Shield, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Subject {
  id: number;
  name: string;
}

interface Topic {
  id: number;
  name: string;
  subject_id: number;
  grade: string | null;
  school_id: string | null;
}

interface StudentProfile {
  grade: string | null;
  school_id: string | null;
}

interface TopicSidebarProps {
  selectedTopicId: number | null;
  onSelectTopic: (subjectId: number, subjectName: string, topicId: number, topicName: string) => void;
  isAdmin: boolean;
  studentProfile?: StudentProfile | null;
  onOpenSettings?: () => void;
}

const TopicSidebar = forwardRef<HTMLDivElement, TopicSidebarProps>(
  ({ selectedTopicId, onSelectTopic, isAdmin, studentProfile, onOpenSettings }, ref) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [search, setSearch] = useState("");
    const [openSubjects, setOpenSubjects] = useState<Set<number>>(new Set());
    const navigate = useNavigate();

    useEffect(() => {
      supabase.from("subjects").select("id, name").then(({ data }) => {
        if (data) setSubjects(data);
      });
      supabase.from("topics").select("id, name, subject_id, grade, school_id").then(({ data }) => {
        if (data) setTopics(data);
      });
    }, []);

    const toggleSubject = (id: number) => {
      setOpenSubjects((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };

    // Filter topics by student's school and grade (admins see all)
    const relevantTopics = isAdmin
      ? topics
      : topics.filter((t) => {
          const schoolMatch = !t.school_id || t.school_id === studentProfile?.school_id;
          const gradeMatch = !t.grade || t.grade === studentProfile?.grade;
          return schoolMatch && gradeMatch;
        });

    const filteredTopics = search.trim()
      ? relevantTopics.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      : relevantTopics;

    const subjectsWithTopics = subjects
      .map((s) => ({
        ...s,
        topics: filteredTopics.filter((t) => t.subject_id === s.id),
      }))
      .filter((s) => s.topics.length > 0);

    const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate("/auth");
    };

    return (
      <div ref={ref} className="flex h-full flex-col bg-secondary/30" dir="rtl">
        {/* Header */}
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            מקצועות ונושאים
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש נושא..."
              className="pr-9 text-sm"
            />
          </div>
        </div>

        {/* Subject list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {subjectsWithTopics.map((s) => (
            <Collapsible
              key={s.id}
              open={openSubjects.has(s.id) || search.trim().length > 0}
              onOpenChange={() => toggleSubject(s.id)}
            >
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
                {openSubjects.has(s.id) || search.trim().length > 0 ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span>{s.name}</span>
                <span className="mr-auto text-xs text-muted-foreground">{s.topics.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pr-4 space-y-0.5">
                {s.topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTopic(s.id, s.name, t.id, t.name)}
                    className={`w-full text-right rounded-lg px-3 py-2 text-sm transition-colors ${
                      t.id === selectedTopicId
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    {search.trim() ? `${s.name} / ${t.name}` : t.name}
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
          {subjectsWithTopics.length === 0 && search.trim() && (
            <p className="text-center text-sm text-muted-foreground py-8">לא נמצאו נושאים</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 space-y-2">
          {onOpenSettings && (
            <Button onClick={onOpenSettings} variant="ghost" className="w-full justify-start gap-2 text-sm">
              <Settings className="h-4 w-4" /> הגדרות
            </Button>
          )}
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
  },
);

TopicSidebar.displayName = "TopicSidebar";

export default TopicSidebar;
