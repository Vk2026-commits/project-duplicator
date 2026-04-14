import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Target, Flag, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfQuarter, endOfQuarter, addQuarters, subQuarters, isToday } from "date-fns";
import { toast } from "sonner";

const PHASE_COLORS: Record<number, string> = {
  1: "hsl(217, 91%, 60%)",   // primary blue
  2: "hsl(160, 84%, 39%)",   // accent green
  3: "hsl(38, 92%, 50%)",    // warning amber
  4: "hsl(280, 67%, 55%)",   // purple
  5: "hsl(350, 80%, 55%)",   // red-pink
  6: "hsl(190, 80%, 45%)",   // teal
};

const PHASE_BG: Record<number, string> = {
  1: "bg-primary/20 text-primary border-primary/30",
  2: "bg-accent/20 text-accent border-accent/30",
  3: "bg-[hsl(38,92%,50%)]/20 text-[hsl(38,92%,50%)] border-[hsl(38,92%,50%)]/30",
  4: "bg-[hsl(280,67%,55%)]/20 text-[hsl(280,67%,55%)] border-[hsl(280,67%,55%)]/30",
  5: "bg-destructive/20 text-destructive border-destructive/30",
  6: "bg-[hsl(190,80%,45%)]/20 text-[hsl(190,80%,45%)] border-[hsl(190,80%,45%)]/30",
};

const STATUS_BADGE: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  completed: "bg-accent/20 text-accent",
};

type CalendarTask = {
  id: string;
  phase: number;
  phase_name: string;
  title: string;
  description: string | null;
  notes: string | null;
  due_date: string;
  due_date_end: string | null;
  assigned_to: string | null;
  status: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  is_milestone: boolean;
  color: string | null;
  created_by: string;
};

export default function CalendarPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentQuarter, setCurrentQuarter] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTask, setEditTask] = useState<CalendarTask | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["calendar-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_tasks")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as CalendarTask[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-assign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("archived", false)
        .order("full_name");
      if (error) throw error;
      return data as { id: string; full_name: string | null }[];
    },
  });

  // Phase progress
  const phaseProgress = useMemo(() => {
    const phases: Record<number, { total: number; completed: number; name: string }> = {};
    tasks.forEach((t) => {
      if (!phases[t.phase]) phases[t.phase] = { total: 0, completed: 0, name: t.phase_name };
      phases[t.phase].total++;
      if (t.status === "completed") phases[t.phase].completed++;
    });
    return phases;
  }, [tasks]);

  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100);
  }, [tasks]);

  // This month's priorities
  const thisMonthTasks = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return tasks
      .filter((t) => {
        const d = new Date(t.due_date);
        return d >= start && d <= end && t.status !== "completed";
      })
      .slice(0, 5);
  }, [tasks]);

  // Monthly view helpers
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    // Pad start
    const startDay = start.getDay();
    const padded: (Date | null)[] = Array(startDay).fill(null);
    return [...padded, ...days];
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks.forEach((t) => {
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Quarterly
  const quarterMonths = useMemo(() => {
    const qs = startOfQuarter(currentQuarter);
    return [qs, addMonths(qs, 1), addMonths(qs, 2)];
  }, [currentQuarter]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Year 1 Execution Calendar</h1>
            <p className="text-muted-foreground text-sm mt-1">6-phase roadmap for your investment group</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setEditTask(null); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          )}
        </div>

        {/* Dashboard Widget: This Month's Priorities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                This Month's Priorities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {thisMonthTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No pending tasks this month 🎉</p>
              ) : (
                <div className="space-y-2">
                  {thisMonthTasks.map((t) => (
                    <div key={t.id} className={`flex items-center justify-between p-2 rounded-lg bg-secondary/50 ${isAdmin ? "cursor-pointer hover:bg-secondary" : ""}`} onClick={() => { if (isAdmin) { setEditTask(t); setShowAddDialog(true); } }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PHASE_COLORS[t.phase] || "hsl(var(--primary))" }} />
                        <span className="text-sm font-medium truncate">{t.title}</span>
                        {t.is_milestone && <Flag className="w-3 h-3 text-primary shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{format(new Date(t.due_date), "MMM d")}</span>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[t.status]}`}>
                          {t.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Year 1 Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
              {Object.entries(phaseProgress).sort(([a], [b]) => Number(a) - Number(b)).map(([phase, info]) => {
                const pct = info.total > 0 ? Math.round((info.completed / info.total) * 100) : 0;
                return (
                  <div key={phase}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">P{phase}: {info.name}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PHASE_COLORS[Number(phase)] }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Views */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* MONTHLY VIEW */}
          <TabsContent value="monthly">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="grid grid-cols-7 gap-px">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground p-1 sm:p-2">{d}</div>
                  ))}
                  {monthDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="min-h-[60px] sm:min-h-[80px]" />;
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayTasks = tasksByDate[dateStr] || [];
                    const today = isToday(day);
                    return (
                      <div
                        key={dateStr}
                        className={`min-h-[60px] sm:min-h-[80px] border border-border/50 rounded p-1 cursor-pointer hover:bg-secondary/50 transition-colors ${today ? "ring-1 ring-primary bg-primary/5" : ""}`}
                        onClick={() => {
                          if (isAdmin) {
                            setSelectedDate(day);
                            setEditTask(null);
                            setShowAddDialog(true);
                          }
                        }}
                      >
                        <div className={`text-xs font-medium mb-0.5 ${today ? "text-primary" : "text-muted-foreground"}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayTasks.slice(0, 3).map((t) => (
                            <div
                              key={t.id}
                              className={`text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate ${isAdmin ? "cursor-pointer" : ""}`}
                              style={{
                                background: `${PHASE_COLORS[t.phase] || "hsl(var(--primary))"}22`,
                                color: PHASE_COLORS[t.phase] || "hsl(var(--primary))",
                                borderLeft: `2px solid ${PHASE_COLORS[t.phase] || "hsl(var(--primary))"}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAdmin) {
                                  setEditTask(t);
                                  setShowAddDialog(true);
                                }
                              }}
                            >
                              {t.is_milestone && "🏁 "}{t.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-[9px] text-muted-foreground pl-1">+{dayTasks.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUARTERLY VIEW */}
          <TabsContent value="quarterly">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentQuarter(subQuarters(currentQuarter, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">
                    Q{Math.ceil((startOfQuarter(currentQuarter).getMonth() + 1) / 3)} {format(currentQuarter, "yyyy")}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentQuarter(addQuarters(currentQuarter, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quarterMonths.map((m) => {
                    const mStart = startOfMonth(m);
                    const mEnd = endOfMonth(m);
                    const monthTasks = tasks.filter((t) => {
                      const d = new Date(t.due_date);
                      return d >= mStart && d <= mEnd;
                    });
                    return (
                      <div key={m.toISOString()} className="space-y-2">
                        <h3 className="font-semibold text-sm border-b border-border pb-1">{format(m, "MMMM yyyy")}</h3>
                        {monthTasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No tasks</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                            {monthTasks.map((t) => (
                              <div
                                key={t.id}
                                className={`p-2 rounded-lg bg-secondary/50 ${isAdmin ? "cursor-pointer hover:bg-secondary" : ""} text-sm`}
                                onClick={() => { if (isAdmin) { setEditTask(t); setShowAddDialog(true); } }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PHASE_COLORS[t.phase] }} />
                                  <span className="font-medium truncate text-xs">{t.title}</span>
                                  {t.is_milestone && <Flag className="w-3 h-3 text-primary" />}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-muted-foreground">{format(new Date(t.due_date), "MMM d")}</span>
                                  <Badge variant="outline" className={`text-[9px] ${STATUS_BADGE[t.status]}`}>
                                    {t.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE VIEW */}
          <TabsContent value="timeline">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase);
                if (phaseTasks.length === 0) return null;
                const info = phaseProgress[phase];
                const pct = info ? (info.total > 0 ? Math.round((info.completed / info.total) * 100) : 0) : 0;
                return (
                  <Card key={phase}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-8 rounded-sm" style={{ background: PHASE_COLORS[phase] }} />
                          <div>
                            <CardTitle className="text-base">Phase {phase}: {phaseTasks[0].phase_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {phaseTasks.length} tasks · {pct}% complete
                            </p>
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PHASE_COLORS[phase] }} />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="relative pl-6 border-l-2 border-border space-y-3">
                        {phaseTasks.map((t) => (
                          <div
                            key={t.id}
                            className={`relative ${isAdmin ? "cursor-pointer" : ""} group`}
                            onClick={() => { if (isAdmin) { setEditTask(t); setShowAddDialog(true); } }}
                          >
                            <div
                              className="absolute -left-[calc(1.5rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full border-2"
                              style={{
                                borderColor: PHASE_COLORS[phase],
                                background: t.status === "completed" ? PHASE_COLORS[phase] : "hsl(var(--card))",
                              }}
                            />
                            <div className="p-3 rounded-lg bg-secondary/30 group-hover:bg-secondary/60 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-medium text-sm truncate">{t.title}</span>
                                  {t.is_milestone && <Flag className="w-3.5 h-3.5 text-primary shrink-0" />}
                                  {t.is_recurring && <Clock className="w-3 h-3 text-muted-foreground shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-muted-foreground">{format(new Date(t.due_date), "MMM d")}</span>
                                  <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[t.status]}`}>
                                    {t.status.replace("_", " ")}
                                  </Badge>
                                </div>
                              </div>
                              {t.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Task Dialog */}
      <TaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        task={editTask}
        profiles={profiles}
        isAdmin={isAdmin}
        userId={user?.id || ""}
        selectedDate={selectedDate}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
          setShowAddDialog(false);
          setEditTask(null);
          setSelectedDate(null);
        }}
      />
    </Layout>
  );
}

function TaskDialog({
  open,
  onOpenChange,
  task,
  profiles,
  isAdmin,
  userId,
  selectedDate,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task: CalendarTask | null;
  profiles: { id: string; full_name: string | null }[];
  isAdmin: boolean;
  userId: string;
  selectedDate: Date | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState("1");
  const [phaseName, setPhaseName] = useState("Foundation");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [status, setStatus] = useState("not_started");
  const [isMilestone, setIsMilestone] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const phaseNames: Record<string, string> = {
    "1": "Foundation",
    "2": "Capital & Strategy",
    "3": "Deal Flow Creation",
    "4": "First Deal Execution",
    "5": "Systems & Scale",
    "6": "Second + Third Deals",
  };

  // Populate form when dialog opens or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setNotes(task.notes || "");
        setPhase(String(task.phase));
        setPhaseName(task.phase_name);
        setDueDate(task.due_date);
        setAssignedTo(task.assigned_to || "");
        setStatus(task.status);
        setIsMilestone(task.is_milestone);
        setIsRecurring(task.is_recurring);
      } else {
        setTitle("");
        setDescription("");
        setNotes("");
        setPhase("1");
        setPhaseName("Foundation");
        setDueDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
        setAssignedTo("");
        setStatus("not_started");
        setIsMilestone(false);
        setIsRecurring(false);
      }
      setShowDeleteConfirm(false);
    }
  }, [open, task, selectedDate]);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: description || null,
        notes: notes || null,
        phase: Number(phase),
        phase_name: phaseNames[phase] || phaseName,
        due_date: dueDate,
        assigned_to: assignedTo || null,
        status,
        is_milestone: isMilestone,
        is_recurring: isRecurring,
        created_by: userId,
      };
      if (task) {
        const { error } = await supabase.from("calendar_tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calendar_tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(task ? "Task updated" : "Task created");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const { error } = await supabase.from("calendar_tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Notes / Meeting Summary</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add notes about what happened, decisions made, etc." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phase</Label>
                <Select value={phase} onValueChange={(v) => { setPhase(v); setPhaseName(phaseNames[v] || ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(phaseNames).map(([k, v]) => (
                      <SelectItem key={k} value={k}>P{k}: {v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || "Unnamed"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isMilestone} onChange={(e) => setIsMilestone(e.target.checked)} className="rounded" />
                Milestone
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded" />
                Recurring
              </label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {task && isAdmin && (
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={deleteMutation.isPending}>
                Delete
              </Button>
            )}
            <Button onClick={() => saveMutation.mutate()} disabled={!title || !dueDate || saveMutation.isPending}>
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete "<span className="font-medium text-foreground">{task?.title}</span>". This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setShowDeleteConfirm(false); deleteMutation.mutate(); }} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
