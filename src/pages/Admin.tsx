import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AdminSection = "schools" | "subjects" | "topics" | "prompts" | "students";

const sidebarItems: { key: AdminSection; label: string; icon: React.ElementType }[] = [
  { key: "schools", label: "בתי ספר", icon: School },
  { key: "subjects", label: "מקצועות", icon: BookOpen },
  { key: "topics", label: "נושאים", icon: Puzzle },
  { key: "prompts", label: "פרומפטים", icon: Brain },
  { key: "students", label: "תלמידים", icon: Users },
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
            <h2 className="text-lg font-bold text-primary">Teechi Admin</h2>
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
            <TopicsSection topics={topics} subjects={subjects} reload={loadAllTopics} toast={toast} />
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
function TopicsSection({ topics, subjects, reload, toast }: { topics: any[]; subjects: any[]; reload: () => void; toast: any }) {
  const [name, setName] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [newTopicSubject, setNewTopicSubject] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const filtered = subjectFilter
    ? topics.filter((t) => String(t.subject_id) === subjectFilter)
    : topics;

  const add = async () => {
    if (!name.trim() || !newTopicSubject) return;
    const { error } = await supabase.from("topics").insert({ name: name.trim(), subject_id: Number(newTopicSubject) });
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setName("");
    reload();
    toast({ title: "נושא נוסף ✅" });
  };

  const update = async () => {
    if (!editName.trim() || editId === null) return;
    await supabase.from("topics").update({ name: editName.trim() }).eq("id", editId);
    setEditId(null);
    reload();
    toast({ title: "עודכן ✅" });
  };

  const remove = async (id: number) => {
    await supabase.from("topics").delete().eq("id", id);
    reload();
  };

  const getSubjectName = (id: number) => subjects.find((s) => s.id === id)?.name || "—";

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
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הנושא" onKeyDown={(e) => e.key === "Enter" && add()} />
                <Button onClick={add} className="shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
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
              <TableHead className="w-28">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{getSubjectName(t.subject_id)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(t.id); setEditName(t.name); }}>
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
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">אין נושאים</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת נושא</DialogTitle></DialogHeader>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
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

  const filtered = students.filter((s) => s.student_name.includes(search));
  const getSchoolName = (id: string | null) => {
    if (!id) return "—";
    return schools.find((s) => s.id === id)?.name || "—";
  };

  return (
    <>
      <SectionHeader title="תלמידים" icon={Users} count={students.length} />
      <SearchBar value={search} onChange={setSearch} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>בית ספר</TableHead>
              <TableHead>כיתה</TableHead>
              <TableHead>תאריך הצטרפות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.student_name}</TableCell>
                <TableCell>{getSchoolName(s.school_id)}</TableCell>
                <TableCell>{s.grade || "—"}</TableCell>
                <TableCell>{new Date(s.created_at).toLocaleDateString("he-IL")}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">אין תלמידים</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* ========== Shared Components ========== */
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
