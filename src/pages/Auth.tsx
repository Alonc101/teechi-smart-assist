import { useState, useEffect } from "react";
import { LoaderPinwheel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const GRADES = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("schools").select("id, name").order("name").then(({ data }) => {
      if (data) setSchools(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!grade || !schoolId) {
          toast({ title: "שגיאה", description: "יש לבחור כיתה ובית ספר", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { student_name: studentName, grade, school_id: schoolId },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "נרשמת בהצלחה!",
          description: "בדוק את המייל שלך לאימות החשבון.",
        });
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Teechi 🎓</CardTitle>
          <p className="text-muted-foreground">{isLogin ? "התחברות" : "הרשמה"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">שם התלמיד</Label>
                  <Input
                    id="name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="השם שלך"
                    required={!isLogin}
                  />
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
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "טוען..." : isLogin ? "התחבר" : "הירשם"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "אין לך חשבון? הירשם" : "יש לך חשבון? התחבר"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
