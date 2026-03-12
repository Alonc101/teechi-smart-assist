import { useEffect, useState } from "react";
import byIcon from "@/assets/By-icon1.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowRight,
  Loader2,
  Save,
  School,
  BookOpen,
  Puzzle,
  Brain,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AdminSection = "schools" | "subjects" | "topics" | "prompts" | "students" | "chatHistory";

const sidebarItems: { key: AdminSection; label: string; icon: React.ElementType }[] = [
  { key: "schools", label: "בתי ספר", icon: School },
  { key: "subjects", label: "מקצועות", icon: BookOpen },
  { key: "topics", label: "נושאים", icon: Puzzle },
  { key: "prompts", label: "פרומפטים", icon: Brain },
  { key: "students", label: "תלמידים", icon: Users },
  { key: "chatHistory", label: "היסטוריית צ׳אט", icon: MessageSquare },
];

const Admin = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<AdminSection>("schools");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Shared data
  const [schools, setSchools] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, authLoading, isAdmin, navigate]);

  const loadSchools = () =>
    supabase.from("schools").select("*").order("name").then(({ data }) => data && setSchools(data));
  const loadSubjects = () =>
    supabase.from("subjects").select("*").order("name").then(({ data }) => data && setSubjects(data));
  const loadAllTopics = () =>
    supabase.from("topics").select("*").order("name").then(({ data }) => data && setTopics(data));
  const loadPrompts = () =>
    supabase.from("prompts").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setPrompts(data));
  const loadStudents = () =>
    supabase.from("students").select("*").order("student_name").then(({ data }) => data && setStudents(data));

  useEffect(() => {
    loadSchools();
    loadSubjects();
    loadAllTopics();
    loadPrompts();
    loadStudents();
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-l bg-card transition-all duration-200 ${
          sidebarCollapsed ? "w-16" : "w-56"
        }`}
      >
        <div className="flex items-center justify-between border-b px-3 py-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <img src={byIcon} alt="לוגו" className="h-6 w-6" />
              <span className="text-lg font-bold text-primary">Teechi Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-2 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowRight className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>חזרה לצ׳אט</span>}
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>התנתק</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          {activeSection === "schools" && (
            <SchoolsSection schools={schools} reload={loadSchools} toast={toast} />
          )}
          {activeSection === "subjects" && (
            <SubjectsSection subjects={subjects} reload={loadSubjects} toast={toast} />
          )}
          {activeSection === "topics" && (
            <TopicsSection topics={topics} subjects={subjects} schools={schools} reload={loadAllTopics} toast={toast} />
          )}
          {activeSection === "prompts" && (
            <PromptsSection
              prompts={prompts}
              schools={schools}
              subjects={subjects}
              reload={loadPrompts}
              toast={toast}
            />
          )}
          {activeSection === "students" && (
            <StudentsSection students={students} schools={schools} reload={loadStudents} toast={toast} />
          )}
          {activeSection === "chatHistory" && (
            <ChatHistorySection students={students} subjects={subjects} topics={topics} toast={toast} />
          )}
        </div>
      </main>
    </div>
  );
};

/* ========== Schools ========== */
function SchoolsSection({ schools, reload, toast }: { schools: any[]; reload: () => void; toast: any }) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");

  const filtered = schools.filter((s) => s.name.includes(search));

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("schools").insert({ name: name.trim() });
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setName("");
    reload();
    toast({ title: "בית ספר נוסף בהצלחה ✅" });
  };

  const update = async () => {
    if (!editName.trim() || !editId) return;
    await supabase.from("schools").update({ name: editName.trim() }).eq("id", editId);
    setEditId(null);
    reload();
    toast({ title: "עודכן בהצלחה ✅" });
  };

  const remove = async (id: string) => {
    await supabase.from("schools").delete().eq("id", id);
    reload();
    toast({ title: "נמחק" });
  };

  return (
    <>
      <SectionHeader title="בתי ספר" icon={School} count={schools.length} />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם בית הספר החדש" onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add} className="gap-1 shrink-0"><Plus className="h-4 w-4" /> הוסף</Button>
          </div>
        </CardContent>
      </Card>
      <SearchBar value={search} onChange={setSearch} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead className="w-28">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(s.id); setEditName(s.name); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">אין בתי ספר</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת בית ספר</DialogTitle></DialogHeader>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          <DialogFooter>
            <Button onClick={update}><Save className="h-4 w-4 ml-1" /> שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ========== Subjects ========== */
function SubjectsSection({ subjects, reload, toast }: { subjects: any[]; reload: () => void; toast: any }) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("subjects").insert({ name: name.trim() });
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setName("");
    reload();
    toast({ title: "מקצוע נוסף ✅" });
  };

  const update = async () => {
    if (!editName.trim() || editId === null) return;
    await supabase.from("subjects").update({ name: editName.trim() }).eq("id", editId);
    setEditId(null);
    reload();
    toast({ title: "עודכן ✅" });
  };

  const remove = async (id: number) => {
    await supabase.from("subjects").delete().eq("id", id);
    reload();
  };

  return (
    <>
      <SectionHeader title="מקצועות" icon={BookOpen} count={subjects.length} />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם המקצוע" onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add} className="gap-1 shrink-0"><Plus className="h-4 w-4" /> הוסף</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead className="w-28">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(s.id); setEditName(s.name); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {subjects.length === 0 && (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">אין מקצועות</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת מקצוע</DialogTitle></DialogHeader>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          <DialogFooter>
            <Button onClick={update}><Save className="h-4 w-4 ml-1" /> שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ========== Topics ========== */
function TopicsSection({ topics, subjects, schools, reload, toast }: { topics: any[]; subjects: any[]; schools: any[]; reload: () => void; toast: any }) {
  const GRADES = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];
  const [name, setName] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [newTopicSubject, setNewTopicSubject] = useState<string>("");
  const [newTopicGrade, setNewTopicGrade] = useState<string>("");
  const [newTopicSchool, setNewTopicSchool] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editSchool, setEditSchool] = useState("");

  const filtered = subjectFilter && subjectFilter !== "all"
    ? topics.filter((t) => String(t.subject_id) === subjectFilter)
    : topics;

  const add = async () => {
    if (!name.trim() || !newTopicSubject) return;
    const { error } = await supabase.from("topics").insert({
      name: name.trim(),
      subject_id: Number(newTopicSubject),
      grade: newTopicGrade || null,
      school_id: newTopicSchool && newTopicSchool !== "all" ? newTopicSchool : null,
    });
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setName("");
    reload();
    toast({ title: "נושא נוסף ✅" });
  };

  const startEdit = (t: any) => {
    setEditId(t.id);
    setEditName(t.name);
    setEditGrade(t.grade || "");
    setEditSchool(t.school_id || "");
  };

  const update = async () => {
    if (!editName.trim() || editId === null) return;
    await supabase.from("topics").update({
      name: editName.trim(),
      grade: editGrade || null,
      school_id: editSchool && editSchool !== "all" ? editSchool : null,
    }).eq("id", editId);
    setEditId(null);
    reload();
    toast({ title: "עודכן ✅" });
  };

  const remove = async (id: number) => {
    await supabase.from("topics").delete().eq("id", id);
    reload();
  };

  const getSubjectName = (id: number) => subjects.find((s) => s.id === id)?.name || "—";
  const getSchoolName = (id: string | null) => {
    if (!id) return "הכל";
    return schools.find((s: any) => s.id === id)?.name || "—";
  };

  return (
    <>
      <SectionHeader title="נושאים" icon={Puzzle} count={topics.length} />
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>מקצוע</Label>
              <Select value={newTopicSubject} onValueChange={setNewTopicSubject}>
                <SelectTrigger><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>שם הנושא</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הנושא" onKeyDown={(e) => e.key === "Enter" && add()} />
            </div>
            <div>
              <Label>כיתה (אופציונלי)</Label>
              <Select value={newTopicGrade} onValueChange={setNewTopicGrade}>
                <SelectTrigger><SelectValue placeholder="כל הכיתות" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הכיתות</SelectItem>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>בית ספר (אופציונלי)</Label>
              <Select value={newTopicSchool} onValueChange={setNewTopicSchool}>
                <SelectTrigger><SelectValue placeholder="כל בתי הספר" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל בתי הספר</SelectItem>
                  {schools.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={add} className="gap-1"><Plus className="h-4 w-4" /> הוסף נושא</Button>
        </CardContent>
      </Card>

      <div className="mb-4">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="סנן לפי מקצוע" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>נושא</TableHead>
              <TableHead>מקצוע</TableHead>
              <TableHead>כיתה</TableHead>
              <TableHead>בית ספר</TableHead>
              <TableHead className="w-28">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{getSubjectName(t.subject_id)}</TableCell>
                <TableCell>{t.grade || "הכל"}</TableCell>
                <TableCell>{getSchoolName(t.school_id)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">אין נושאים</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת נושא</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>שם</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>כיתה</Label>
              <Select value={editGrade} onValueChange={setEditGrade}>
                <SelectTrigger><SelectValue placeholder="כל הכיתות" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הכיתות</SelectItem>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>בית ספר</Label>
              <Select value={editSchool} onValueChange={setEditSchool}>
                <SelectTrigger><SelectValue placeholder="כל בתי הספר" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל בתי הספר</SelectItem>
                  {schools.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={update}><Save className="h-4 w-4 ml-1" /> שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ========== Prompts ========== */
function PromptsSection({
  prompts, schools, subjects, reload, toast,
}: { prompts: any[]; schools: any[]; subjects: any[]; reload: () => void; toast: any }) {
  const [promptTopics, setPromptTopics] = useState<any[]>([]);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    id: null as number | null,
    school_id: "",
    grade: "",
    subject_id: "",
    topic_id: "",
    language: "he",
    system_prompt: "",
    assistant_instructions: "",
    active: true,
  });

  useEffect(() => {
    if (form.subject_id) {
      supabase.from("topics").select("*").eq("subject_id", Number(form.subject_id)).then(({ data }) => data && setPromptTopics(data));
    } else {
      setPromptTopics([]);
    }
  }, [form.subject_id]);

  const resetForm = () => setForm({ id: null, school_id: "", grade: "", subject_id: "", topic_id: "", language: "he", system_prompt: "", assistant_instructions: "", active: true });

  const save = async () => {
    if (!form.subject_id || !form.topic_id || !form.system_prompt.trim()) {
      return toast({ title: "שגיאה", description: "חובה למלא מקצוע, נושא ופרומפט", variant: "destructive" });
    }
    const payload = {
      school_id: form.school_id && form.school_id !== "general" ? form.school_id : null,
      grade: form.grade || null,
      subject_id: Number(form.subject_id),
      topic_id: Number(form.topic_id),
      language: form.language,
      system_prompt: form.system_prompt,
      assistant_instructions: form.assistant_instructions || null,
      active: form.active,
    };
    if (form.id) {
      await supabase.from("prompts").update(payload).eq("id", form.id);
    } else {
      await supabase.from("prompts").insert(payload);
    }
    setDialogOpen(false);
    resetForm();
    reload();
    toast({ title: form.id ? "פרומפט עודכן ✅" : "פרומפט נוסף ✅" });
  };

  const edit = (p: any) => {
    setForm({
      id: p.id,
      school_id: p.school_id || "",
      grade: p.grade || "",
      subject_id: String(p.subject_id),
      topic_id: String(p.topic_id),
      language: p.language,
      system_prompt: p.system_prompt,
      assistant_instructions: p.assistant_instructions || "",
      active: p.active,
    });
    setDialogOpen(true);
  };

  const remove = async (id: number) => {
    await supabase.from("prompts").delete().eq("id", id);
    reload();
    toast({ title: "נמחק" });
  };

  const [allTopics, setAllTopics] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("topics").select("id, name").then(({ data }) => data && setAllTopics(data));
  }, []);

  const getSubjectName = (id: number) => subjects.find((s) => s.id === id)?.name || "—";
  const getTopicName = (id: number) => allTopics.find((t) => t.id === id)?.name || "—";
  const getSchoolName = (id: string | null) => {
    if (!id) return "כללי";
    return schools.find((s) => s.id === id)?.name || "—";
  };

  let filtered = prompts;
  if (filterSchool && filterSchool !== "all") {
    filtered = filtered.filter((p) => (filterSchool === "general" ? !p.school_id : p.school_id === filterSchool));
  }
  if (filterSubject && filterSubject !== "all") {
    filtered = filtered.filter((p) => String(p.subject_id) === filterSubject);
  }

  return (
    <>
      <SectionHeader title="פרומפטים" icon={Brain} count={prompts.length} />

      {/* Priority note */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          <strong>לוגיקת עדיפות:</strong> 1️⃣ school + grade + subject + topic → 2️⃣ school + subject + topic → 3️⃣ כללי (school=null)
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <Select value={filterSchool} onValueChange={setFilterSchool}>
            <SelectTrigger className="w-44"><SelectValue placeholder="סנן בית ספר" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="general">כללי</SelectItem>
              {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-44"><SelectValue placeholder="סנן מקצוע" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-1 mr-auto">
          <Plus className="h-4 w-4" /> פרומפט חדש
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>בית ספר</TableHead>
              <TableHead>מקצוע</TableHead>
              <TableHead>נושא</TableHead>
              <TableHead>כיתה</TableHead>
              <TableHead>פעיל</TableHead>
              <TableHead className="w-28">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{getSchoolName(p.school_id)}</TableCell>
                <TableCell>{getSubjectName(p.subject_id)}</TableCell>
                <TableCell>{getTopicName(p.topic_id)}</TableCell>
                <TableCell>{p.grade || "הכל"}</TableCell>
                <TableCell>{p.active ? <span className="text-primary font-bold">✅</span> : "❌"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">אין פרומפטים</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { resetForm(); } setDialogOpen(o); }}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "עריכת פרומפט" : "פרומפט חדש"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>בית ספר</Label>
                <Select value={form.school_id || "general"} onValueChange={(v) => setForm((f) => ({ ...f, school_id: v === "general" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">כללי (ללא)</SelectItem>
                    {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>כיתה</Label>
                <Input value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} placeholder="לדוגמה: ז׳" />
              </div>
              <div>
                <Label>מקצוע *</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm((f) => ({ ...f, subject_id: v, topic_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>נושא *</Label>
                <Select value={form.topic_id} onValueChange={(v) => setForm((f) => ({ ...f, topic_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>
                    {promptTopics.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>שפה</Label>
              <Input value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} />
            </div>
            <div>
              <Label>System Prompt *</Label>
              <Textarea value={form.system_prompt} onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))} rows={5} className="font-mono text-sm" />
            </div>
            <div>
              <Label>Assistant Instructions</Label>
              <Textarea value={form.assistant_instructions} onChange={(e) => setForm((f) => ({ ...f, assistant_instructions: e.target.value }))} rows={3} className="font-mono text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <Label>פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
            <Button onClick={save} className="gap-1"><Save className="h-4 w-4" /> שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ========== Students ========== */
function StudentsSection({ students, schools, reload, toast }: { students: any[]; schools: any[]; reload: () => void; toast: any }) {
  const [search, setSearch] = useState("");
  const [authUsers, setAuthUsers] = useState<Record<string, { email: string; banned: boolean; email_confirmed: boolean }>>({});
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: string; userId: string; name: string } | null>(null);

  const filtered = students.filter((s) => s.student_name.includes(search));
  const getSchoolName = (id: string | null) => {
    if (!id) return "—";
    return schools.find((s) => s.id === id)?.name || "—";
  };

  const isUserAdmin = (userId: string) => userRoles.some((r) => r.user_id === userId && r.role === "admin");
  const isUserBanned = (userId: string) => authUsers[userId]?.banned ?? false;
  const isEmailConfirmed = (userId: string) => authUsers[userId]?.email_confirmed ?? true;

  const loadAuthUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.functions.invoke("admin-users", {
      body: { action: "list", userId: "all" },
    });
    if (data?.users) setAuthUsers(data.users);
  };

  const loadRoles = async () => {
    const { data } = await supabase.from("user_roles").select("*");
    if (data) setUserRoles(data);
  };

  useEffect(() => {
    loadAuthUsers();
    loadRoles();
  }, []);

  const executeAction = async (action: string, userId: string) => {
    setLoadingAction(userId + action);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action, userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const messages: Record<string, string> = {
        ban: "המשתמש הושהה ✅",
        unban: "המשתמש אושר ✅",
        make_admin: "המשתמש הפך לאדמין ✅",
        remove_admin: "הרשאת אדמין הוסרה ✅",
        delete: "המשתמש נמחק ✅",
        confirm_email: "האימייל אושר ✅",
      };
      toast({ title: messages[action] || "בוצע ✅" });

      if (action === "delete") {
        reload();
      }
      await loadAuthUsers();
      await loadRoles();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAction(null);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <SectionHeader title="ניהול תלמידים" icon={Users} count={students.length} />
      <SearchBar value={search} onChange={setSearch} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>בית ספר</TableHead>
              <TableHead>כיתה</TableHead>
              <TableHead>אימייל מאומת</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תפקיד</TableHead>
              <TableHead className="w-44">פעולות</TableHead>
              <TableHead className="w-40">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const banned = isUserBanned(s.user_id);
              const admin = isUserAdmin(s.user_id);
              const emailConfirmed = isEmailConfirmed(s.user_id);
              const email = authUsers[s.user_id]?.email || "—";
              return (
                <TableRow key={s.id} className={banned ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{s.student_name}</TableCell>
                  <TableCell className="text-xs">{email}</TableCell>
                  <TableCell>{getSchoolName(s.school_id)}</TableCell>
                  <TableCell>{s.grade || "—"}</TableCell>
                  <TableCell>
                    {emailConfirmed ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">מאומת</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">ממתין</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {banned ? (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">מושהה</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">פעיל</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin ? (
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">אדמין</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">תלמיד</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {!emailConfirmed && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                          disabled={!!loadingAction}
                          onClick={() => executeAction("confirm_email", s.user_id)}
                        >
                          {loadingAction === s.user_id + "confirm_email" ? <Loader2 className="h-3 w-3 animate-spin" /> : "אמת מייל"}
                        </Button>
                      )}
                      {banned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          disabled={!!loadingAction}
                          onClick={() => executeAction("unban", s.user_id)}
                        >
                          {loadingAction === s.user_id + "unban" ? <Loader2 className="h-3 w-3 animate-spin" /> : "אשר"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          disabled={!!loadingAction}
                          onClick={() => setConfirmAction({ action: "ban", userId: s.user_id, name: s.student_name })}
                        >
                          השהה
                        </Button>
                      )}
                      {admin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          disabled={!!loadingAction}
                          onClick={() => setConfirmAction({ action: "remove_admin", userId: s.user_id, name: s.student_name })}
                        >
                          הסר אדמין
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          disabled={!!loadingAction}
                          onClick={() => setConfirmAction({ action: "make_admin", userId: s.user_id, name: s.student_name })}
                        >
                          הפוך לאדמין
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!!loadingAction}
                        onClick={() => setConfirmAction({ action: "delete", userId: s.user_id, name: s.student_name })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">אין תלמידים</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "ban" && "השהיית משתמש"}
              {confirmAction?.action === "make_admin" && "הפיכה לאדמין"}
              {confirmAction?.action === "remove_admin" && "הסרת הרשאת אדמין"}
              {confirmAction?.action === "delete" && "מחיקת משתמש"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction?.action === "ban" && `האם אתה בטוח שברצונך להשהות את "${confirmAction.name}"?`}
            {confirmAction?.action === "make_admin" && `האם להפוך את "${confirmAction?.name}" לאדמין?`}
            {confirmAction?.action === "remove_admin" && `האם להסיר הרשאת אדמין מ-"${confirmAction?.name}"?`}
            {confirmAction?.action === "delete" && `האם אתה בטוח שברצונך למחוק את "${confirmAction?.name}"? פעולה זו בלתי הפיכה.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>ביטול</Button>
            <Button
              variant={confirmAction?.action === "delete" ? "destructive" : "default"}
              onClick={() => confirmAction && executeAction(confirmAction.action, confirmAction.userId)}
              disabled={!!loadingAction}
            >
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
              אישור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ========== Chat History ========== */
function ChatHistorySection({
  students, subjects, topics, toast,
}: { students: any[]; subjects: any[]; topics: any[]; toast: any }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [filterStudent, setFilterStudent] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setSessions(data);
  };

  useEffect(() => { loadSessions(); }, []);

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.student_name || "—";
  const getSubjectName = (id: number | null) => {
    if (!id) return "—";
    return subjects.find((s) => s.id === id)?.name || "—";
  };
  const getTopicName = (id: number | null) => {
    if (!id) return "—";
    return topics.find((t) => t.id === id)?.name || "—";
  };

  const viewMessages = async (session: any) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
    setLoadingMessages(false);
  };

  const deleteSession = async (sessionId: string) => {
    // Delete messages first (foreign key), then session
    await supabase.from("chat_messages").delete().eq("session_id", sessionId);
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast({ title: "שיחה נמחקה" });
  };

  let filtered = sessions;
  if (filterStudent && filterStudent !== "all") {
    filtered = filtered.filter((s) => s.student_id === filterStudent);
  }
  if (filterSubject && filterSubject !== "all") {
    filtered = filtered.filter((s) => String(s.subject_id) === filterSubject);
  }
  if (filterTopic && filterTopic !== "all") {
    filtered = filtered.filter((s) => String(s.topic_id) === filterTopic);
  }

  // Unique students from sessions
  const sessionStudentIds = [...new Set(sessions.map((s) => s.student_id))];
  const sessionStudents = students.filter((st) => sessionStudentIds.includes(st.id));

  return (
    <>
      <SectionHeader title="היסטוריית צ׳אט" icon={MessageSquare} count={sessions.length} />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-44"><SelectValue placeholder="סנן תלמיד" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {sessionStudents.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.student_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-44"><SelectValue placeholder="סנן מקצוע" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-44"><SelectValue placeholder="סנן נושא" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תלמיד</TableHead>
              <TableHead>כותרת</TableHead>
              <TableHead>מקצוע</TableHead>
              <TableHead>נושא</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead className="w-28">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{getStudentName(s.student_id)}</TableCell>
                <TableCell>{s.title}</TableCell>
                <TableCell>{getSubjectName(s.subject_id)}</TableCell>
                <TableCell>{getTopicName(s.topic_id)}</TableCell>
                <TableCell>{new Date(s.updated_at).toLocaleDateString("he-IL")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => viewMessages(s)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSession(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">אין שיחות</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Messages Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(o) => !o && setSelectedSession(null)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              שיחה: {selectedSession?.title} — {getStudentName(selectedSession?.student_id || "")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {loadingMessages ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">אין הודעות</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-3 text-sm ${
                    m.role === "user"
                      ? "bg-primary/10 mr-8"
                      : "bg-muted ml-8"
                  }`}
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {m.role === "user" ? "תלמיד" : "מורה AI"} • {new Date(m.created_at).toLocaleTimeString("he-IL")}
                  </p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


function SectionHeader({ title, icon: Icon, count }: { title: string; icon: React.ElementType; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{count} רשומות</p>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="חיפוש..." className="pr-10" />
    </div>
  );
}

export default Admin;
