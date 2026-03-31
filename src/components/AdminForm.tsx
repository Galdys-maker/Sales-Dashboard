import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "../lib/supabase";
import { Loader2, Plus } from "lucide-react";

interface AdminFormProps {
  onDataAdded: () => void;
}

type Product = "Kombucha" | "Mpills" | "Other";
type Team = "Akvizice" | "Retence";

export default function AdminForm({ onDataAdded }: AdminFormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [contacts, setContacts] = useState("");
  const [boxes, setBoxes] = useState("");
  const [team, setTeam] = useState<Team | "">("");
  const [product, setProduct] = useState<Product | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !date || !contacts || !boxes || !team || !product) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: insertError } = await supabase
      .from("sales_data")
      .insert({
        caller_name: name,
        date: date,
        contacts: parseInt(contacts, 10),
        boxes: parseInt(boxes, 10),
        team: team,
        product: product,
      });

    if (insertError) {
      console.error("Error inserting data:", insertError);
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setName("");
    setContacts("");
    setBoxes("");
    setTeam("");
    setProduct("");
    setLoading(false);

    // Refresh dashboard data
    onDataAdded();

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Sales Record
        </CardTitle>
        <CardDescription>
          Enter new sales data to add to the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Caller name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contacts">Contacts</Label>
              <Input
                id="contacts"
                type="number"
                placeholder="Number of contacts"
                value={contacts}
                onChange={(e) => setContacts(e.target.value)}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="boxes">Boxes</Label>
              <Input
                id="boxes"
                type="number"
                placeholder="Number of boxes"
                value={boxes}
                onChange={(e) => setBoxes(e.target.value)}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={team} onValueChange={(v: Team) => setTeam(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Akvizice">Akvizice</SelectItem>
                  <SelectItem value="Retence">Retence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={product} onValueChange={(v: Product) => setProduct(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kombucha">Kombucha</SelectItem>
                  <SelectItem value="Mpills">Mpills</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          {success && (
            <p className="text-sm text-green-600">Record added successfully!</p>
          )}

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
