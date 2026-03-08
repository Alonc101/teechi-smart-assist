import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GRADES = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];

interface StudentSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSaved?: () => void;
}

export default function StudentSettings({ open, onOpenChange, userId, onSaved }: StudentSettingsProps) {
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    Promise.all([
      supabase.from("schools").select("id, name").order("name"),
      supabase.from("students").select("student_name, grade, school_id").eq("user_id", userId).single(),
    ]).then(([schoolsRes, studentRes]) => {
      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (studentRes.data) {
        setStudentName(studentRes.data.student_name || "");
        setGrade(studentRes.data.grade || "");
        setSchoolId(studentRes.data.school_id || "");
      }
      setFetching(false);
    });
  }, [open, userId]);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("students")
      .update({
        student_name: studentName.trim() || "תלמיד",
        grade: grade || null,
        school_id: schoolId || null,
      })
      .eq("user_id", userId);
    setLoading(false);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "הפרטים עודכנו בהצלחה ✅" });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>הגדרות פרופיל</DialogTitle>
        </DialogHeader>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>בית ספר</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger><SelectValue placeholder="בחר בית ספר" /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>כיתה</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={save} disabled={loading || fetching}>
            <Save className="h-4 w-4 ml-1" /> שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
