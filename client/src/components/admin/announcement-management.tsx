import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Megaphone, Tag } from "lucide-react";

export function AnnouncementManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement",
    isActive: true,
    priority: 0,
    actionUrl: "",
  });

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ["/api/admin/announcements"],
  });

  const announcements = announcementsData?.announcements || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setIsAdding(false);
      setFormData({ title: "", content: "", type: "announcement", isActive: true, priority: 0, actionUrl: "" });
      toast({ title: "Success", description: "Announcement created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Deleted", description: "Announcement removed" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/announcements/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements & Offers</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add New</>}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Announcement title"
              />
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea 
                value={formData.content} 
                onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                placeholder="Description or offer details"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="offer">Special Offer</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority (higher shows first)</Label>
                <Input 
                  type="number" 
                  value={formData.priority} 
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Action URL (Optional)</Label>
              <Input 
                value={formData.actionUrl} 
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })} 
                placeholder="/deposit or external link"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.title || !formData.content}
            >
              {createMutation.isPending ? "Creating..." : "Create Entry"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {announcements.map((item: any) => (
          <Card key={item.id} className={item.isActive ? "" : "opacity-60"}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex gap-3">
                <div className="mt-1">
                  {item.type === 'offer' ? <Tag className="text-orange-500" /> : <Megaphone className="text-primary" />}
                </div>
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded uppercase">{item.type}</span>
                    {item.actionUrl && <span className="text-xs text-primary">{item.actionUrl}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch 
                  checked={item.isActive} 
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, isActive: checked })}
                />
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
