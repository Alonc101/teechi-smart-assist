import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil, ArrowRight, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Schools
  const [schools, setSchools] = useState<any[]>([]);
  const [newSchool, setNewSchool] = useState("");

  // Subjects & Topics
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState<string>("");

  // Prompts
  const [prompts, setPrompts] = useState<any[]>([]);
  const [promptForm, setPromptForm] = useState({
    id: null as number | null,
    school_id: "" as string,
    grade: "",
    subject_id: "",
    topic_id: "",
    language: "he",
    system_prompt: "",
    assistant_instructions: "",
    active: true,
  });
  const [promptTopics, setPromptTopics] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, authLoading, isAdmin, navigate]);

  const loadSchools = () => supabase.from("schools").select("*").order("name").then(({ data }) => data && setSchools(data));
  const loadSubjects = () => supabase.from("subjects").select("*").order("name").then(({ data }) => data && setSubjects(data));
  const loadTopics = (subjectId: string) => {
    if (!subjectId) return;
    supabase.from("topics").select("*").eq("subject_id", Number(subjectId)).order("name").then(({ data }) => data && setTopics(data));
  };
  const loadPrompts = () => supabase.from("prompts").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setPrompts(data));

  useEffect(() => { loadSchools(); loadSubjects(); loadPrompts(); }, []);

  useEffect(() => { if (selectedSubjectForTopics) loadTopics(selectedSubjectForTopics); }, [selectedSubjectForTopics]);

  useEffect(() => {
    if (promptForm.subject_id) {
      supabase.from("topics").select("*").eq("subject_id", Number(promptForm.subject_id)).then(({ data }) => data && setPromptTopics(data));
    } else {
      setPromptTopics([]);
    }
  }, [promptForm.subject_id]);

  // School CRUD
  const addSchool = async () => {
    if (!newSchool.trim()) return;
    await supabase.from("schools").insert({ name: newSchool.trim() });
    setNewSchool("");
    loadSchools();
    toast({ title: "בית ספר נוסף" });
  };
  const deleteSchool = async (id: string) => {
    await supabase.from("schools").delete().eq("id", id);
    loadSchools();
  };

  // Subject CRUD
  const addSubject = async () => {
    if (!newSubject.trim()) return;
    await supabase.from("subjects").insert({ name: newSubject.trim() });
    setNewSubject("");
    loadSubjects();
    toast({ title: "מקצוע נוסף" });
  };
  const deleteSubject = async (id: number) => {
    await supabase.from("subjects").delete().eq("id", id);
    loadSubjects();
  };

  // Topic CRUD
  const addTopic = async () => {
    if (!newTopic.trim() || !selectedSubjectForTopics) return;
    await supabase.from("topics").insert({ name: newTopic.trim(), subject_id: Number(selectedSubjectForTopics) });
    setNewTopic("");
    loadTopics(selectedSubjectForTopics);
    toast({ title: "נושא נוסף" });
  };
  const deleteTopic = async (id: number) => {
    await supabase.from("topics").delete().eq("id", id);
    loadTopics(selectedSubjectForTopics);
  };

  // Prompt CRUD
  const savePrompt = async () => {
    const { id, ...data } = promptForm;
    const payload = {
      school_id: data.school_id || null,
      grade: data.grade || null,
      subject_id: Number(data.subject_id),
      topic_id: Number(data.topic_id),
      language: data.language,
      system_prompt: data.system_prompt,
      assistant_instructions: data.assistant_instructions || null,
      active: data.active,
    };

    if (id) {
      await supabase.from("prompts").update(payload).eq("id", id);
    } else {
      await supabase.from("prompts").insert(payload);
    }
    resetPromptForm();
    loadPrompts();
    toast({ title: id ? "פרומפט עודכן" : "פרומפט נוסף" });
  };

  const editPrompt = (p: any) => {
    setPromptForm({
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
  };

  const deletePrompt = async (id: number) => {
    await supabase.from("prompts").delete().eq("id", id);
    loadPrompts();
  };

  const resetPromptForm = () => {
    setPromptForm({ id: null, school_id: "", grade: "", subject_id: "", topic_id: "", language: "he", system_prompt: "", assistant_instructions: "", active: true });
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b bg-primary px-4 py-3">
        <h1 className="text-xl font-bold text-primary-foreground">Teechi Admin 🛠️</h1>
        <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={() => navigate("/")}>
          <ArrowRight className="h-4 w-4 ml-1" /> חזרה לצ׳אט
        </Button>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="schools">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="schools">בתי ספר</TabsTrigger>
            <TabsTrigger value="subjects">מקצועות ונושאים</TabsTrigger>
            <TabsTrigger value="prompts">פרומפטים</TabsTrigger>
          </TabsList>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>הוסף בית ספר</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={newSchool} onChange={(e) => setNewSchool(e.target.value)} placeholder="שם בית הספר" onKeyDown={(e) => e.key === "Enter" && addSchool()} />
                  <Button onClick={addSchool}><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
            <Table>
              <TableHeader><TableRow><TableHead>שם</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
              <TableBody>
                {schools.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => deleteSchool(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Subjects & Topics Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>הוסף מקצוע</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="שם המקצוע" onKeyDown={(e) => e.key === "Enter" && addSubject()} />
                  <Button onClick={addSubject}><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
            <Table>
              <TableHeader><TableRow><TableHead>מקצוע</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => deleteSubject(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Card>
              <CardHeader><CardTitle>נושאים לפי מקצוע</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedSubjectForTopics} onValueChange={setSelectedSubjectForTopics}>
                  <SelectTrigger><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedSubjectForTopics && (
                  <>
                    <div className="flex gap-2">
                      <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="שם הנושא" onKeyDown={(e) => e.key === "Enter" && addTopic()} />
                      <Button onClick={addTopic}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <Table>
                      <TableHeader><TableRow><TableHead>נושא</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {topics.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.name}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => deleteTopic(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{promptForm.id ? "ערוך פרומפט" : "פרומפט חדש"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>בית ספר</Label>
                    <Select value={promptForm.school_id} onValueChange={(v) => setPromptForm((p) => ({ ...p, school_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="כללי (ללא)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">כללי (ללא בית ספר)</SelectItem>
                        {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>כיתה</Label>
                    <Input value={promptForm.grade} onChange={(e) => setPromptForm((p) => ({ ...p, grade: e.target.value }))} placeholder="לדוגמה: ז׳" />
                  </div>
                  <div>
                    <Label>מקצוע</Label>
                    <Select value={promptForm.subject_id} onValueChange={(v) => setPromptForm((p) => ({ ...p, subject_id: v, topic_id: "" }))}>
                      <SelectTrigger><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>נושא</Label>
                    <Select value={promptForm.topic_id} onValueChange={(v) => setPromptForm((p) => ({ ...p, topic_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="בחר נושא" /></SelectTrigger>
                      <SelectContent>
                        {promptTopics.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>שפה</Label>
                  <Input value={promptForm.language} onChange={(e) => setPromptForm((p) => ({ ...p, language: e.target.value }))} />
                </div>
                <div>
                  <Label>System Prompt</Label>
                  <Textarea value={promptForm.system_prompt} onChange={(e) => setPromptForm((p) => ({ ...p, system_prompt: e.target.value }))} rows={4} />
                </div>
                <div>
                  <Label>Assistant Instructions</Label>
                  <Textarea value={promptForm.assistant_instructions} onChange={(e) => setPromptForm((p) => ({ ...p, assistant_instructions: e.target.value }))} rows={3} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={promptForm.active} onCheckedChange={(v) => setPromptForm((p) => ({ ...p, active: v }))} />
                  <Label>פעיל</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePrompt} className="gap-1"><Save className="h-4 w-4" /> שמור</Button>
                  {promptForm.id && <Button variant="outline" onClick={resetPromptForm}>ביטול</Button>}
                </div>
              </CardContent>
            </Card>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מקצוע</TableHead>
                  <TableHead>נושא</TableHead>
                  <TableHead>כיתה</TableHead>
                  <TableHead>פעיל</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{subjects.find((s) => s.id === p.subject_id)?.name || p.subject_id}</TableCell>
                    <TableCell>{p.topic_id}</TableCell>
                    <TableCell>{p.grade || "הכל"}</TableCell>
                    <TableCell>{p.active ? "✅" : "❌"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => editPrompt(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePrompt(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
