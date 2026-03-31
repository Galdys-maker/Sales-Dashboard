import React, { useMemo, useState } from "react";
import { format, isSameDay, isSameWeek, isSameMonth, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { MOCK_DATA, Product, Team } from "../data/mockData";

const TARGET_BOXES_DAILY = 10;
const TARGET_BOXES_WEEKLY = 50;
const TARGET_BOXES_MONTHLY = 200;

export default function TeamDetail() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [teamFilter, setTeamFilter] = useState<Team | "All">("All");

  const today = new Date();

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((record) => {
      const recordDate = parseISO(record.date);
      
      let dateMatch = false;
      if (period === "today") {
        dateMatch = isSameDay(recordDate, today);
      } else if (period === "week") {
        dateMatch = isSameWeek(recordDate, today, { weekStartsOn: 1 });
      } else if (period === "month") {
        dateMatch = isSameMonth(recordDate, today);
      }

      const teamMatch = teamFilter === "All" || record.team === teamFilter;

      return dateMatch && teamMatch;
    });
  }, [period, teamFilter]);

  const teamStats = useMemo(() => {
    const grouped = filteredData.reduce((acc, record) => {
      if (!acc[record.callerName]) {
        acc[record.callerName] = { 
          name: record.callerName, 
          team: record.team,
          boxes: 0, 
          contacts: 0 
        };
      }
      acc[record.callerName].boxes += record.boxes;
      acc[record.callerName].contacts += record.contacts;
      return acc;
    }, {} as Record<string, { name: string; team: string; boxes: number; contacts: number }>);

    return Object.values(grouped).sort((a: any, b: any) => b.boxes - a.boxes);
  }, [filteredData]);

  const getPerformanceColor = (boxes: number, target: number) => {
    const ratio = boxes / target;
    if (ratio >= 1.2) return "gold";
    if (ratio >= 1.0) return "success";
    if (ratio >= 0.8) return "warning";
    return "destructive";
  };

  const getPerformanceLabel = (boxes: number, target: number) => {
    const ratio = boxes / target;
    if (ratio >= 1.2) return "Výrazně nad target";
    if (ratio >= 1.0) return "Nad target";
    if (ratio >= 0.8) return "Blízko targetu";
    return "Pod target";
  };

  const handleExportCSV = () => {
    const headers = ["Jméno", "Tým", "Kontakty", "Boxy", "Konverze (%)"];
    const csvContent = [
      headers.join(","),
      ...teamStats.map(r => {
        const conversion = r.contacts > 0 ? ((r.boxes / r.contacts) * 100).toFixed(1) : "0.0";
        return `"${r.name}","${r.team}",${r.contacts},${r.boxes},${conversion}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `team_export_${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  let target = TARGET_BOXES_DAILY;
  if (period === "week") target = TARGET_BOXES_WEEKLY;
  if (period === "month") target = TARGET_BOXES_MONTHLY;

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Detail Týmu</h2>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Období" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Dnes</SelectItem>
              <SelectItem value="week">Tento týden</SelectItem>
              <SelectItem value="month">Tento měsíc</SelectItem>
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={(v: any) => setTeamFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tým" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Všechny týmy</SelectItem>
              <SelectItem value="Akvizice">Akvizice</SelectItem>
              <SelectItem value="Retence">Retence</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export do CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Výkon Callerů</CardTitle>
          <CardDescription>
            Přehled výkonu jednotlivých členů týmu. Target pro toto období: {target} boxů.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Jméno</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tým</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vytvořené boxy</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kontakty</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Konverze</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {teamStats.map((caller) => {
                    const perfColor = getPerformanceColor(caller.boxes, target);
                    const perfLabel = getPerformanceLabel(caller.boxes, target);
                    const conversion = caller.contacts > 0 ? ((caller.boxes / caller.contacts) * 100).toFixed(1) : "0.0";

                    return (
                      <tr key={caller.name} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{caller.name}</td>
                        <td className="p-4 align-middle text-muted-foreground">{caller.team}</td>
                        <td className="p-4 align-middle font-bold text-lg">{caller.boxes}</td>
                        <td className="p-4 align-middle">{caller.contacts}</td>
                        <td className="p-4 align-middle">{conversion}%</td>
                        <td className="p-4 align-middle">
                          <Badge variant={perfColor as any}>{perfLabel}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {teamStats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        Žádná data pro vybrané období
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
